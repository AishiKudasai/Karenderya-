import { State } from './state.js';
import { Utils } from './utils.js';

export const MenuModule = {
  render(container) {
    const menu = State.menu;
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
        <h2>Menu Management</h2>
        <button class="btn btn-orange" id="add-menu-btn">+ Add Menu Item</button>
      </div>
      <div class="card">
        <input type="text" id="menu-search" placeholder="Search menu items..." style="margin-bottom:0;">
      </div>
      <div id="menu-table-container"></div>
    `;

    this.renderMenuTable(menu);

    document.getElementById('add-menu-btn').addEventListener('click', () => this.openMenuModal());
    document.getElementById('menu-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = State.menu.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
      this.renderMenuTable(filtered);
    });
  },

  renderMenuTable(menu) {
    const container = document.getElementById('menu-table-container');
    if (!container) return;

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Category</th>
            <th>Description</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Availability</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${menu.map(m => `
            <tr>
              <td><b>${Utils.escapeHtml(m.name)}</b></td>
              <td>${Utils.escapeHtml(m.category)}</td>
              <td>${Utils.escapeHtml(m.description)}</td>
              <td class="mono-price">${Utils.formatCurrency(m.price)}</td>
              <td>${m.stock}</td>
              <td><span style="color:${m.available ? 'green' : 'red'}; font-weight:bold;">${m.available ? 'Available' : 'Unavailable'}</span></td>
              <td>
                <button class="btn btn-outline menu-edit-btn" data-id="${m.id}" style="padding:0.2rem 0.5rem; font-size:0.8rem;">Edit</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.menu-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = State.menu.find(x => x.id === id);
        if (item) this.openMenuModal(item);
      });
    });
  },

  openMenuModal(item = null) {
    const isEdit = !!item;
    const categories = ["Rice Meals", "Ulam", "Silog Meals", "Vegetables", "Snacks", "Drinks", "Extras"];
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <form id="menu-form">
          <label>Item Name</label>
          <input type="text" id="m-name" value="${item ? Utils.escapeHtml(item.name) : ''}" required>
          <label>Category</label>
          <select id="m-category">
            ${categories.map(cat => `<option value="${cat}" ${item && item.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
          </select>
          <label>Description</label>
          <textarea id="m-desc">${item ? Utils.escapeHtml(item.description) : ''}</textarea>
          <label>Price (PHP)</label>
          <input type="number" step="0.01" id="m-price" value="${item ? item.price : 100}" required>
          <label>Stock Quantity</label>
          <input type="number" id="m-stock" value="${item ? item.stock : 50}" required>
          <label style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
            <input type="checkbox" id="m-avail" ${!item || item.available ? 'checked' : ''} style="width:auto; margin:0;"> Available for ordering
          </label>
          <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
            <button type="submit" class="btn">Save Menu Item</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());

    modal.querySelector('#menu-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('m-name').value.trim();
      const category = document.getElementById('m-category').value;
      const description = document.getElementById('m-desc').value.trim();
      const price = parseFloat(document.getElementById('m-price').value);
      const stock = parseInt(document.getElementById('m-stock').value);
      const available = document.getElementById('m-avail').checked;

      let menu = State.menu;
      if (isEdit) {
        menu = menu.map(m => m.id === item.id ? { ...m, name, category, description, price, stock, available } : m);
      } else {
        menu.push({
          id: Utils.generateId('menu'),
          name,
          category,
          description,
          price,
          stock,
          available,
          image: ''
        });
      }

      State.saveMenu(menu);
      modal.remove();
      Utils.showToast("Menu item saved.");
      this.render(document.getElementById('main-view-container'));
    });
  }
};