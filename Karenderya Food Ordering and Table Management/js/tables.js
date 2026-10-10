import { State } from './state.js';
import { Utils } from './utils.js';

export const TablesModule = {
  render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
        <h2>Table & Floor Management</h2>
        <button class="btn btn-orange" id="add-table-btn">+ Add Table</button>
      </div>
      <div class="table-grid" id="tables-grid-container"></div>
    `;

    this.renderTableTiles();

    document.getElementById('add-table-btn').addEventListener('click', () => {
      this.openTableModal();
    });
  },

  renderTableTiles() {
    const grid = document.getElementById('tables-grid-container');
    if (!grid) return;
    const tables = State.tables;
    const bills = State.bills;

    grid.innerHTML = tables.map(t => {
      let activeBill = null;
      if (t.sessionId) {
        activeBill = bills.find(b => b.sessionId === t.sessionId && b.status === 'unpaid');
      }
      return `
        <div class="table-tile ${t.status}" data-id="${t.id}">
          <div class="table-header-row">
            <span class="table-num">Table ${Utils.escapeHtml(t.number)}</span>
            <span class="table-status-badge">${t.status}</span>
          </div>
          <p style="font-size: 0.85rem; color:#555;">Capacity: ${t.capacity} persons</p>
          ${t.customerName ? `<p style="font-size: 0.85rem; margin-top:0.3rem;"><b>Customer:</b> ${Utils.escapeHtml(t.customerName)}</p>` : ''}
          ${activeBill ? `<p style="font-size: 0.85rem; margin-top:0.3rem; color:var(--color-burnt-orange);"><b>Bill:</b> ${Utils.formatCurrency(activeBill.total)}</p>` : ''}
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.table-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const tableId = tile.getAttribute('data-id');
        this.openTableContextPanel(tableId);
      });
    });
  },

  openTableModal(table = null) {
    const isEdit = !!table;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? 'Edit Table' : 'Add New Table'}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <form id="table-form">
          <label>Table Number / Name</label>
          <input type="text" id="tbl-number" value="${table ? Utils.escapeHtml(table.number) : ''}" required>
          <label>Seating Capacity</label>
          <input type="number" id="tbl-capacity" value="${table ? table.capacity : 4}" min="1" required>
          <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.5rem;">
            ${isEdit ? '<button type="button" class="btn btn-danger" id="tbl-delete">Delete Table</button>' : ''}
            <button type="submit" class="btn">Save Table</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());

    if (isEdit) {
      modal.querySelector('#tbl-delete').addEventListener('click', () => {
        if (table.status === 'occupied' || table.sessionId) {
          alert("Cannot delete a table with an active dining session.");
          return;
        }
        if (confirm(`Delete Table ${table.number}?`)) {
          let tables = State.tables.filter(t => t.id !== table.id);
          State.saveTables(tables);
          modal.remove();
          this.renderTableTiles();
          Utils.showToast("Table deleted.");
        }
      });
    }

    modal.querySelector('#table-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const num = document.getElementById('tbl-number').value.trim();
      const cap = parseInt(document.getElementById('tbl-capacity').value);

      let tables = State.tables;
      if (isEdit) {
        tables = tables.map(t => t.id === table.id ? { ...t, number: num, capacity: cap } : t);
      } else {
        tables.push({
          id: Utils.generateId('tbl'),
          number: num,
          capacity: cap,
          status: 'available',
          customerName: '',
          sessionId: null
        });
      }
      State.saveTables(tables);
      modal.remove();
      this.renderTableTiles();
      Utils.showToast("Table saved successfully.");
    });
  },

  openTableContextPanel(tableId) {
    const table = State.tables.find(t => t.id === tableId);
    if (!table) return;

    const customers = State.customers;
    const bills = State.bills;
    const activeBill = table.sessionId ? bills.find(b => b.sessionId === table.sessionId && b.status === 'unpaid') : null;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Table ${Utils.escapeHtml(table.number)} (${table.status.toUpperCase()})</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div style="font-size:0.9rem; display:flex; flex-direction:column; gap:0.75rem;">
          <p><b>Capacity:</b> ${table.capacity} persons</p>
          <p><b>Customer:</b> ${table.customerName || 'None'}</p>
          ${activeBill ? `<p><b>Current Bill:</b> <span class="mono-price">${Utils.formatCurrency(activeBill.total)}</span></p>` : ''}
          
          <div style="margin-top:1rem; display:flex; flex-wrap:wrap; gap:0.5rem;">
            ${table.status === 'available' ? `
              <button class="btn btn-orange" id="ctx-seat">Seat Customer & Start Session</button>
              <button class="btn btn-secondary" id="ctx-reserve">Reserve Table</button>
            ` : ''}
            ${table.status === 'occupied' ? `
              <button class="btn btn-orange" id="ctx-order">Add Food Order</button>
              ${activeBill ? `<button class="btn" id="ctx-checkout">View Bill / Checkout</button>` : ''}
              <button class="btn btn-danger" id="ctx-release">Release Table</button>
            ` : ''}
            ${table.status === 'reserved' ? `
              <button class="btn btn-orange" id="ctx-arrive">Customer Arrived (Seat)</button>
              <button class="btn btn-danger" id="ctx-cancel-res">Cancel Reservation</button>
            ` : ''}
            <button class="btn btn-outline" id="ctx-edit">Edit Table Details</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());

    modal.querySelector('#ctx-edit').addEventListener('click', () => {
      modal.remove();
      this.openTableModal(table);
    });

    if (modal.querySelector('#ctx-seat')) {
      modal.querySelector('#ctx-seat').addEventListener('click', () => {
        modal.remove();
        this.openSeatingModal(table);
      });
    }

    if (modal.querySelector('#ctx-reserve')) {
      modal.querySelector('#ctx-reserve').addEventListener('click', () => {
        modal.remove();
        this.openReservationModal(table);
      });
    }

    if (modal.querySelector('#ctx-order')) {
      modal.querySelector('#ctx-order').addEventListener('click', () => {
        modal.remove();
        window.location.hash = '';
        // Navigate to POS ordering with table preset
        sessionStorage.setItem('pos_table_id', table.id);
        sessionStorage.setItem('pos_session_id', table.sessionId);
        document.querySelector('[data-view="ordering"]').click();
      });
    }

    if (modal.querySelector('#ctx-checkout')) {
      modal.querySelector('#ctx-checkout').addEventListener('click', () => {
        modal.remove();
        sessionStorage.setItem('billing_bill_id', activeBill.id);
        document.querySelector('[data-view="billing"]').click();
      });
    }

    if (modal.querySelector('#ctx-release')) {
      modal.querySelector('#ctx-release').addEventListener('click', () => {
        if (activeBill && activeBill.status === 'unpaid') {
          alert("Cannot release table while there is an unpaid bill balance.");
          return;
        }
        if (confirm(`Release Table ${table.number}?`)) {
          let tables = State.tables.map(t => t.id === table.id ? { ...t, status: 'available', customerName: '', sessionId: null } : t);
          State.saveTables(tables);
          modal.remove();
          this.renderTableTiles();
          Utils.showToast(`Table ${table.number} released.`);
        }
      });
    }

    if (modal.querySelector('#ctx-arrive')) {
      modal.querySelector('#ctx-arrive').addEventListener('click', () => {
        // Convert reservation to session
        let resList = State.reservations.filter(r => r.tableId === table.id);
        let currentRes = resList[resList.length - 1];
        let custName = currentRes ? currentRes.customerName : 'Walk-in';

        let sessionId = Utils.generateId('sess');
        let sessions = State.sessions;
        sessions.push({ id: sessionId, tableId: table.id, customerName: custName, openedAt: Utils.getCurrentDateTime() });
        State.saveSessions(sessions);

        let tables = State.tables.map(t => t.id === table.id ? { ...t, status: 'occupied', customerName: custName, sessionId: sessionId } : t);
        State.saveTables(tables);

        // Remove reservation
        if (currentRes) {
          State.saveReservations(State.reservations.filter(r => r.id !== currentRes.id));
        }

        modal.remove();
        this.renderTableTiles();
        Utils.showToast(`Table ${table.number} seated successfully.`);
      });
    }

    if (modal.querySelector('#ctx-cancel-res')) {
      modal.querySelector('#ctx-cancel-res').addEventListener('click', () => {
        if (confirm("Cancel reservation for this table?")) {
          State.saveReservations(State.reservations.filter(r => r.tableId !== table.id));
          let tables = State.tables.map(t => t.id === table.id ? { ...t, status: 'available' } : t);
          State.saveTables(tables);
          modal.remove();
          this.renderTableTiles();
          Utils.showToast("Reservation canceled.");
        }
      });
    }
  },

  openSeatingModal(table) {
    const customers = State.customers;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Seat Customer - Table ${table.number}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <form id="seat-form">
          <label>Select Customer</label>
          <select id="seat-customer-id">
            <option value="">Walk-in Customer</option>
            ${customers.map(c => `<option value="${c.id}">${Utils.escapeHtml(c.name)} (${c.contact})</option>`).join('')}
          </select>
          <label>Or Enter Walk-in Name</label>
          <input type="text" id="seat-walkin-name" placeholder="Optional Name">
          <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
            <button type="submit" class="btn btn-orange">Start Dining Session</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());

    modal.querySelector('#seat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const custId = document.getElementById('seat-customer-id').value;
      const walkin = document.getElementById('seat-walkin-name').value.trim();

      let customerName = walkin || 'Walk-in Guest';
      if (custId) {
        const c = customers.find(x => x.id === custId);
        if (c) customerName = c.name;
      }

      const sessionId = Utils.generateId('sess');
      const sessions = State.sessions;
      sessions.push({ id: sessionId, tableId: table.id, customerName, openedAt: Utils.getCurrentDateTime() });
      State.saveSessions(sessions);

      const tables = State.tables.map(t => t.id === table.id ? { ...t, status: 'occupied', customerName, sessionId } : t);
      State.saveTables(tables);

      modal.remove();
      this.renderTableTiles();
      Utils.showToast(`Dining session started for Table ${table.number}.`);
    });
  },

  openReservationModal(table) {
    const customers = State.customers;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Reserve Table ${table.number}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <form id="res-form">
          <label>Customer Name</label>
          <input type="text" id="res-name" required>
          <label>Contact Number</label>
          <input type="text" id="res-contact" required>
          <label>Reservation Date</label>
          <input type="date" id="res-date" required>
          <label>Reservation Time</label>
          <input type="time" id="res-time" required>
          <div style="margin-top:1rem; display:flex; justify-content:flex-end;">
            <button type="submit" class="btn">Confirm Reservation</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());

    modal.querySelector('#res-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const customerName = document.getElementById('res-name').value;
      const contact = document.getElementById('res-contact').value;
      const reservationDate = document.getElementById('res-date').value;
      const reservationTime = document.getElementById('res-time').value;

      // Check overlapping reservation for same table & date/time
      const reservations = State.reservations;
      reservations.push({
        id: Utils.generateId('res'),
        tableId: table.id,
        tableNumber: table.number,
        customerName,
        contact,
        reservationDate,
        reservationTime
      });
      State.saveReservations(reservations);

      const tables = State.tables.map(t => t.id === table.id ? { ...t, status: 'reserved' } : t);
      State.saveTables(tables);

      modal.remove();
      this.renderTableTiles();
      Utils.showToast("Table reserved successfully.");
    });
  }
};