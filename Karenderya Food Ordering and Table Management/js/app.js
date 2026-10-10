import { StorageManager } from './storage.js';
import { State } from './state.js';
import { Utils } from './utils.js';
import { TablesModule } from './tables.js';
import { CustomersModule } from './customers.js';
import { MenuModule } from './menu.js';
import { OrdersModule } from './orders.js';
import { BillingModule } from './billing.js';
import { ReceiptsModule } from './receipts.js';

export const App = {
  currentView: 'dashboard',

  async init() {
    await StorageManager.initStorage();
    this.setupHeader();
    this.setupNavigation();
    this.navigate('dashboard');
  },

  setupHeader() {
    const settings = State.settings;
    document.getElementById('header-restaurant-name').textContent = settings.restaurantName || "Karenderya POS";
    document.getElementById('header-staff-name').textContent = settings.staffName || "Staff";
    
    // Update live clock
    setInterval(() => {
      const now = new Date();
      document.getElementById('header-datetime').textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    }, 1000);
  },

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        this.navigate(view);
      });
    });

    document.getElementById('quick-new-order-btn').addEventListener('click', () => {
      this.navigate('ordering');
    });
  },

  navigate(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-view') === viewName);
    });

    const mainContainer = document.getElementById('main-view-container');
    mainContainer.innerHTML = '';

    switch (viewName) {
      case 'dashboard':
        this.renderDashboard(mainContainer);
        break;
      case 'tables':
        TablesModule.render(mainContainer);
        break;
      case 'ordering':
        OrdersModule.renderPOS(mainContainer);
        break;
      case 'orders':
        OrdersModule.renderList(mainContainer);
        break;
      case 'customers':
        CustomersModule.render(mainContainer);
        break;
      case 'menu':
        MenuModule.render(mainContainer);
        break;
      case 'billing':
        BillingModule.render(mainContainer);
        break;
      case 'receipts':
        ReceiptsModule.render(mainContainer);
        break;
      case 'settings':
        this.renderSettings(mainContainer);
        break;
      default:
        mainContainer.innerHTML = '<h2>View not found</h2>';
    }
  },

  renderDashboard(container) {
    const tables = State.tables;
    const orders = State.orders;
    const bills = State.bills;

    const totalTables = tables.length;
    const availableTables = tables.filter(t => t.status === 'available').length;
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const reservedTables = tables.filter(t => t.status === 'reserved').length;

    const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;
    const readyOrders = orders.filter(o => o.status === 'ready').length;
    const unpaidBills = bills.filter(b => b.status === 'unpaid').length;

    container.innerHTML = `
      <h2 style="margin-bottom: 1rem;">Operational Dashboard</h2>
      <div class="grid-4" style="margin-bottom: 1.5rem;">
        <div class="card" style="cursor:pointer;" id="dash-tbl-card">
          <h4>Tables Overview</h4>
          <p style="font-size:1.8rem; font-weight:bold; margin:0.5rem 0;">${occupiedTables} / ${totalTables}</p>
          <p style="font-size:0.8rem; color:#666;">Available: ${availableTables} | Reserved: ${reservedTables}</p>
        </div>
        <div class="card" style="cursor:pointer;" id="dash-ord-card">
          <h4>Active Orders</h4>
          <p style="font-size:1.8rem; font-weight:bold; margin:0.5rem 0;">${activeOrders}</p>
          <p style="font-size:0.8rem; color:#666;">Preparing: ${preparingOrders} | Ready: ${readyOrders}</p>
        </div>
        <div class="card" style="cursor:pointer;" id="dash-bill-card">
          <h4>Unpaid Bills</h4>
          <p style="font-size:1.8rem; font-weight:bold; margin:0.5rem 0; color:var(--color-burnt-orange);">${unpaidBills}</p>
          <p style="font-size:0.8rem; color:#666;">Ready for cashier checkout</p>
        </div>
        <div class="card">
          <h4>Quick Actions</h4>
          <div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.5rem;">
            <button class="btn btn-orange" id="dash-new-order">New Food Order</button>
            <button class="btn btn-secondary" id="dash-manage-tables">Manage Tables</button>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3>Recent Orders</h3>
          <div style="margin-top: 0.75rem;">
            ${orders.slice(-5).reverse().map(o => `
              <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--color-border); font-size:0.85rem;">
                <div><strong>#${o.orderNumber}</strong> (${o.tableNumber ? 'Table ' + o.tableNumber : 'Takeaway'})</div>
                <div><span class="mono-price">${Utils.formatCurrency(o.total)}</span> - <b>${o.status}</b></div>
              </div>
            `).join('') || '<p style="color:#666; font-size:0.85rem;">No recent orders.</p>'}
          </div>
        </div>
        <div class="card">
          <h3>Upcoming Reservations</h3>
          <div style="margin-top: 0.75rem;">
            ${State.reservations.slice(-5).reverse().map(r => `
              <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--color-border); font-size:0.85rem;">
                <div><strong>${Utils.escapeHtml(r.customerName)}</strong> (Table${r.tableNumber})</div>
                <div>${r.reservationDate}${r.reservationTime}</div>
              </div>
            `).join('') || '<p style="color:#666; font-size:0.85rem;">No active reservations.</p>'}
          </div>
        </div>
      </div>
    `;

    document.getElementById('dash-tbl-card').addEventListener('click', () => this.navigate('tables'));
    document.getElementById('dash-ord-card').addEventListener('click', () => this.navigate('orders'));
    document.getElementById('dash-bill-card').addEventListener('click', () => this.navigate('billing'));
    document.getElementById('dash-new-order').addEventListener('click', () => this.navigate('ordering'));
    document.getElementById('dash-manage-tables').addEventListener('click', () => this.navigate('tables'));
  },

  renderSettings(container) {
    const s = State.settings;
    container.innerHTML = `
      <h2>System Settings</h2>
      <div class="card" style="max-width: 600px; margin-top: 1rem;">
        <form id="settings-form">
          <label>Restaurant Name</label>
          <input type="text" id="set-name" value="${Utils.escapeHtml(s.restaurantName)}">
          
          <label>Address</label>
          <input type="text" id="set-address" value="${Utils.escapeHtml(s.address)}">
          
          <label>Contact Number</label>
          <input type="text" id="set-contact" value="${Utils.escapeHtml(s.contact)}">
          
          <label>Active Staff / Cashier</label>
          <input type="text" id="set-staff" value="${Utils.escapeHtml(s.staffName)}">
          
          <label>Receipt Footer Message</label>
          <textarea id="set-footer">${Utils.escapeHtml(s.receiptFooter)}</textarea>

          <div style="margin-top: 1rem; display: flex; gap: 1rem;">
            <button type="submit" class="btn">Save Settings</button>
            <button type="button" class="btn btn-danger" id="reset-demo-btn">Reset Demo Data</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      s.restaurantName = document.getElementById('set-name').value;
      s.address = document.getElementById('set-address').value;
      s.contact = document.getElementById('set-contact').value;
      s.staffName = document.getElementById('set-staff').value;
      s.receiptFooter = document.getElementById('set-footer').value;
      State.saveSettings(s);
      this.setupHeader();
      Utils.showToast("Settings saved successfully!");
    });

    document.getElementById('reset-demo-btn').addEventListener('click', () => {
      if (confirm("Are you sure you want to reset all data back to initial demo state?")) {
        StorageManager.resetDemoData();
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});