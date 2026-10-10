import { State } from './state.js';
import { Utils } from './utils.js';

export const CustomersModule = {
  render(container) {
    const customers = State.customers;
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
        <h2>Customer Management</h2>
        <button class="btn btn-orange" id="add-cust-btn">+ Add Customer</button>
      </div>
      <div class="card">
        <input type="text" id="cust-search" placeholder="Search by name or contact number..." style="margin-bottom:0;">
      </div>
      <div id="cust-table-container"></div>
    `;

    this.renderCustomerTable(customers);

    document.getElementById('add-cust-btn').addEventListener('click', () => this.openCustomerModal());
    document.getElementById('cust-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = State.customers.filter(c => c.name.toLowerCase().includes(q) || c.contact.includes(q));
      this.renderCustomerTable(filtered);
    });
  },

  renderCustomerTable(customers) {
    const container = document.getElementById('cust-table-container');
    if (!container) return;

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Notes</th>
            <th>Date Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(c => `
            <tr>
              <td><b>${Utils.escapeHtml(c.name)}</b></td>
              <td>${Utils.escapeHtml(c.contact)}</td>
              <td>${Utils.escapeHtml(c.email || '-')}</td>
              <td>${Utils.escapeHtml(c.notes || '-')}</td>
              <td>${c.createdAt}</td>
              <td>
                <button class="btn btn-outline cust-edit-btn" data-id="${c.id}" style="padding: 0.2rem 0.5rem; font-size:0.8rem;">Edit</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.cust-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const cust = State.customers.find(x => x.id === id);
        if (cust) this.openCustomerModal(cust);
      });
    });
  },

  openCustomerModal(customer = null) {
    const isEdit = !!customer;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <form id="cust-form">
          <label>Full Name</label>
          <input type="text" id="c-name" value="${customer ? Utils.escapeHtml(customer.name) : ''}" required>
          <label>Contact Number</label>
          <input type="text" id="c-contact" value="${customer ? Utils.escapeHtml(customer.contact) : ''}" required>
          <label>Email (Optional)</label>
          <input type="email" id="c-email" value="${customer ? Utils.escapeHtml(customer.email || '') : ''}">
          <label>Notes (Optional)</label>
          <textarea id="c-notes">${customer ? Utils.escapeHtml(customer.notes || '') : ''}</textarea>
          <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
            <button type="submit" class="btn">Save Customer</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());

    modal.querySelector('#cust-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('c-name').value.trim();
      const contact = document.getElementById('c-contact').value.trim();
      const email = document.getElementById('c-email').value.trim();
      const notes = document.getElementById('c-notes').value.trim();

      // Check duplicate phone
      const existing = State.customers.find(c => c.contact === contact && (!isEdit || c.id !== customer.id));
      if (existing) {
        if (!confirm("A customer with this contact number already exists. Proceed anyway?")) return;
      }

      let customers = State.customers;
      if (isEdit) {
        customers = customers.map(c => c.id === customer.id ? { ...c, name, contact, email, notes } : c);
      } else {
        customers.push({
          id: Utils.generateId('cust'),
          name,
          contact,
          email,
          notes,
          createdAt: new Date().toISOString().slice(0, 10)
        });
      }

      State.saveCustomers(customers);
      modal.remove();
      Utils.showToast("Customer saved successfully.");
      this.render(document.getElementById('main-view-container'));
    });
  }
};