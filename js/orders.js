import { State } from './state.js';
import { Utils } from './utils.js';

export const OrdersModule = {
  currentCart: [],
  selectedTableId: null,
  selectedSessionId: null,

  renderPOS(container) {
    const presetTableId = sessionStorage.getItem('pos_table_id');
    const presetSessionId = sessionStorage.getItem('pos_session_id');
    sessionStorage.removeItem('pos_table_id');
    sessionStorage.removeItem('pos_session_id');

    if (presetTableId) {
      this.selectedTableId = presetTableId;
      this.selectedSessionId = presetSessionId;
    } else {
      this.selectedTableId = null;
      this.selectedSessionId = null;
    }

    const categories = ["All", "Rice Meals", "Ulam", "Silog Meals", "Vegetables", "Snacks", "Drinks", "Extras"];

    container.innerHTML = `
      <div class="pos-layout">
        <!-- Left: Categories -->
        <div class="pos-categories">
          <h4 style="margin-bottom:0.75rem;">Categories</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;" id="pos-cat-list">
            ${categories.map((cat, idx) => `
              <button class="btn btn-outline ${idx === 0 ? 'btn-orange' : ''}" data-cat="${cat}" style="justify-content:flex-start; font-size:0.85rem;">${cat}</button>
            `).join('')}
          </div>
          <div style="margin-top: 1.5rem;">
            <input type="text" id="pos-search" placeholder="Search dish..." style="margin-bottom:0;">
          </div>
        </div>

        <!-- Center: Menu Grid -->
        <div class="pos-menu-grid" id="pos-menu-grid"></div>

        <!-- Right: Order Ticket -->
        <div class="order-ticket">
          <h3>Current Order Ticket</h3>
          <div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.5rem;">
            <label style="margin:0;">Table / Takeaway</label>
            <select id="pos-table-select">
              <option value="">Takeaway</option>
              ${State.tables.map(t => `<option value="${t.id}" ${this.selectedTableId === t.id ? 'selected' : ''}>Table ${t.number} (${t.status})</option>`).join('')}
            </select>
            <label style="margin:0;">Customer</label>
            <select id="pos-customer-select">
              <option value="">Walk-in Customer</option>
              ${State.customers.map(c => `<option value="${c.id}">${Utils.escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>

          <div class="ticket-items" id="ticket-items-container">
            <p style="color:#777; font-size:0.85rem; text-align:center; margin-top:2rem;">No items selected.</p>
          </div>

          <div style="font-size:0.9rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
              <span>Subtotal:</span>
              <span class="mono-price" id="ticket-subtotal">₱0.00</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1rem; margin-top:0.5rem; border-top:1px solid var(--color-border); padding-top:0.5rem;">
              <span>Total:</span>
              <span class="mono-price" id="ticket-total">₱0.00</span>
            </div>
          </div>

          <div style="margin-top: 1rem; display:flex; gap:0.5rem;">
            <button class="btn btn-outline" id="ticket-clear" style="flex:1;">Clear</button>
            <button class="btn btn-orange" id="ticket-confirm" style="flex:2;">Confirm Order</button>
          </div>
        </div>
      </div>
    `;

    this.renderMenuGrid('All');

    // Event listeners
    container.querySelectorAll('#pos-cat-list button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('#pos-cat-list button').forEach(b => b.classList.remove('btn-orange'));
        btn.classList.add('btn-orange');
        this.renderMenuGrid(btn.getAttribute('data-cat'), document.getElementById('pos-search').value);
      });
    });

    document.getElementById('pos-search').addEventListener('input', (e) => {
      const activeCat = container.querySelector('#pos-cat-list button.btn-orange')?.getAttribute('data-cat') || 'All';
      this.renderMenuGrid(activeCat, e.target.value);
    });

    document.getElementById('ticket-clear').addEventListener('click', () => {
      if (this.currentCart.length > 0 && confirm("Clear current order ticket?")) {
        this.currentCart = [];
        this.renderTicket();
      }
    });

    document.getElementById('ticket-confirm').addEventListener('click', () => {
      this.confirmOrder();
    });

    document.getElementById('pos-table-select').addEventListener('change', (e) => {
      this.selectedTableId = e.target.value;
    });
  },

  renderMenuGrid(category, query = '') {
    const grid = document.getElementById('pos-menu-grid');
    if (!grid) return;

    let items = State.menu;
    if (category !== 'All') {
      items = items.filter(m => m.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(m => m.name.toLowerCase().includes(q));
    }

    grid.innerHTML = items.map(m => `
      <div class="menu-tile ${!m.available ? 'unavailable' : ''}" data-id="${m.id}">
        <div>
          <b>${Utils.escapeHtml(m.name)}</b>
          <p style="font-size:0.75rem; color:#666; margin-top:0.2rem;">${Utils.escapeHtml(m.category)}</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
          <span class="mono-price">${Utils.formatCurrency(m.price)}</span>
          <span style="font-size:0.7rem; color:${m.available ? 'green' : 'red'};">${m.available ? 'Stock: ' + m.stock : 'Out'}</span>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.menu-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const id = tile.getAttribute('data-id');
        const item = State.menu.find(m => m.id === id);
        if (!item || !item.available) return;
        this.addToCart(item);
      });
    });
  },

  addToCart(item) {
    const existing = this.currentCart.find(i => i.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.currentCart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        notes: ''
      });
    }
    this.renderTicket();
  },

  renderTicket() {
    const container = document.getElementById('ticket-items-container');
    if (!container) return;

    if (this.currentCart.length === 0) {
      container.innerHTML = '<p style="color:#777; font-size:0.85rem; text-align:center; margin-top:2rem;">No items selected.</p>';
      document.getElementById('ticket-subtotal').textContent = '₱0.00';
      document.getElementById('ticket-total').textContent = '₱0.00';
      return;
    }

    container.innerHTML = this.currentCart.map((item, idx) => `
      <div class="ticket-item-row">
        <div style="flex:1;">
          <b>${Utils.escapeHtml(item.name)}</b><br>
          <span class="mono-price">${Utils.formatCurrency(item.price)} x ${item.qty}</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.25rem;">
          <button class="btn btn-outline" style="padding:0.1rem 0.4rem; font-size:0.75rem;" onclick="window.posDec(${idx})">-</button>
          <span>${item.qty}</span>
          <button class="btn btn-outline" style="padding:0.1rem 0.4rem; font-size:0.75rem;" onclick="window.posInc(${idx})">+</button>
          <button class="btn btn-danger" style="padding:0.1rem 0.4rem; font-size:0.75rem;" onclick="window.posRem(${idx})">&times;</button>
        </div>
      </div>
    `).join('');

    // Global helpers for inline ticket buttons
    window.posInc = (idx) => { this.currentCart[idx].qty += 1; this.renderTicket(); };
    window.posDec = (idx) => {
      this.currentCart[idx].qty -= 1;
      if (this.currentCart[idx].qty <= 0) this.currentCart.splice(idx, 1);
      this.renderTicket();
    };
    window.posRem = (idx) => { this.currentCart.splice(idx, 1); this.renderTicket(); };

    const subtotal = this.currentCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    document.getElementById('ticket-subtotal').textContent = Utils.formatCurrency(subtotal);
    document.getElementById('ticket-total').textContent = Utils.formatCurrency(subtotal);
  },

  confirmOrder() {
    if (this.currentCart.length === 0) {
      alert("Order ticket is empty.");
      return;
    }

    const tableId = document.getElementById('pos-table-select').value;
    const customerId = document.getElementById('pos-customer-select').value;
    let customerName = "Walk-in";
    if (customerId) {
      const c = State.customers.find(x => x.id === customerId);
      if (c) customerName = c.name;
    }

    let tableNumber = null;
    let sessionId = null;

    if (tableId) {
      const table = State.tables.find(t => t.id === tableId);
      if (table) {
        tableNumber = table.number;
        sessionId = table.sessionId;
        if (!sessionId) {
          sessionId = Utils.generateId('sess');
          let sessions = State.sessions;
          sessions.push({ id: sessionId, tableId: table.id, customerName, openedAt: Utils.getCurrentDateTime() });
          State.saveSessions(sessions);
          let tables = State.tables.map(t => t.id === tableId ? { ...t, status: 'occupied', customerName, sessionId } : t);
          State.saveTables(tables);
        }
      }
    }

    const subtotal = this.currentCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const orderId = Utils.generateId('ord');
    const orderNumber = Math.floor(1000 + Math.random() * 9000);

    const newOrder = {
      id: orderId,
      orderNumber,
      tableId: tableId || null,
      tableNumber: tableNumber,
      sessionId: sessionId || null,
      customerName,
      items: [...this.currentCart],
      subtotal,
      discount: 0,
      total: subtotal,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: Utils.getCurrentDateTime()
    };

    let orders = State.orders;
    orders.push(newOrder);
    State.saveOrders(orders);

    // Create or update bill for session or takeaway
    let bills = State.bills;
    if (sessionId) {
      let existingBill = bills.find(b => b.sessionId === sessionId && b.status === 'unpaid');
      if (existingBill) {
        existingBill.orders.push(newOrder.id);
        existingBill.subtotal += subtotal;
        existingBill.total += subtotal;
      } else {
        bills.push({
          id: Utils.generateId('bill'),
          sessionId,
          tableNumber,
          customerName,
          orders: [newOrder.id],
          subtotal,
          discount: 0,
          charges: 0,
          total: subtotal,
          status: 'unpaid'
        });
      }
    } else {
      // Takeaway bill
      bills.push({
        id: Utils.generateId('bill'),
        sessionId: null,
        tableNumber: 'Takeaway',
        customerName,
        orders: [newOrder.id],
        subtotal,
        discount: 0,
        charges: 0,
        total: subtotal,
        status: 'unpaid'
      });
    }
    State.saveBills(bills);

    this.currentCart = [];
    this.renderTicket();
    Utils.showToast(`Order #${orderNumber} confirmed successfully!`);
    
    // Switch to Orders view
    document.querySelector('[data-view="orders"]').click();
  },

  renderList(container) {
    const orders = State.orders;
    container.innerHTML = `
      <h2>Orders Management</h2>
      <div class="card" style="display:flex; gap:1rem; align-items:center;">
        <input type="text" id="order-search" placeholder="Search by order # or customer..." style="margin-bottom:0; flex:1;">
        <select id="order-status-filter" style="width:200px; margin-bottom:0;">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="completed">Completed</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>
      <div id="orders-table-container"></div>
    `;

    this.renderOrdersTable(orders);

    document.getElementById('order-search').addEventListener('input', () => this.filterOrders());
    document.getElementById('order-status-filter').addEventListener('change', () => this.filterOrders());
  },

  filterOrders() {
    const q = document.getElementById('order-search').value.toLowerCase();
    const status = document.getElementById('order-status-filter').value;
    let orders = State.orders;

    if (q) {
      orders = orders.filter(o => o.orderNumber.toString().includes(q) || o.customerName.toLowerCase().includes(q));
    }
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    this.renderOrdersTable(orders);
  },

  renderOrdersTable(orders) {
    const container = document.getElementById('orders-table-container');
    if (!container) return;

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date / Time</th>
            <th>Customer</th>
            <th>Table / Type</th>
            <th>Items Summary</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.slice().reverse().map(o => `
            <tr>
              <td><b>#${o.orderNumber}</b></td>
              <td>${o.createdAt}</td>
              <td>${Utils.escapeHtml(o.customerName)}</td>
              <td>${o.tableNumber ? 'Table ' + o.tableNumber : 'Takeaway'}</td>
              <td>${o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</td>
              <td class="mono-price">${Utils.formatCurrency(o.total)}</td>
              <td><b>${o.status.toUpperCase()}</b></td>
              <td>
                <select class="order-status-select" data-id="${o.id}" style="padding:0.2rem; font-size:0.8rem; width:auto;">
                  <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="preparing" ${o.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                  <option value="ready" ${o.status === 'ready' ? 'selected' : ''}>Ready</option>
                  <option value="served" ${o.status === 'served' ? 'selected' : ''}>Served</option>
                  <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Completed</option>
                  <option value="canceled" ${o.status === 'canceled' ? 'selected' : ''}>Canceled</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.order-status-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = sel.getAttribute('data-id');
        const newStatus = e.target.value;

        if (newStatus === 'canceled') {
          const reason = prompt("Enter cancellation reason:");
          if (!reason) {
            this.renderOrdersTable(State.orders);
            return;
          }
        }

        let orders = State.orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
        State.saveOrders(orders);
        Utils.showToast("Order status updated.");
        this.filterOrders();
      });
    });
  }
};