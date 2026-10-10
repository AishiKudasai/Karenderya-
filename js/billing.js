import { State } from './state.js';
import { Utils } from './utils.js';

export const BillingModule = {
  render(container) {
    const bills = State.bills.filter(b => b.status === 'unpaid');
    container.innerHTML = `
      <h2>Billing and Payments</h2>
      <div class="card">
        <h3>Unpaid Bills</h3>
        ${bills.length === 0 ? '<p style="color:#666; font-size:0.9rem; margin-top:0.5rem;">No unpaid bills right now.</p>' : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Table / Type</th>
                <th>Customer</th>
                <th>Total Amount Due</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${bills.map(b => `
                <tr>
                  <td><b>${b.id}</b></td>
                  <td>${b.tableNumber ? 'Table ' + b.tableNumber : 'Takeaway'}</td>
                  <td>${Utils.escapeHtml(b.customerName)}</td>
                  <td class="mono-price">${Utils.formatCurrency(b.total)}</td>
                  <td>
                    <button class="btn btn-orange btn-checkout" data-id="${b.id}" style="padding:0.3rem 0.7rem; font-size:0.85rem;">Checkout / Pay</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    container.querySelectorAll('.btn-checkout').forEach(btn => {
      btn.addEventListener('click', () => {
        const billId = btn.getAttribute('data-id');
        this.openCheckoutModal(billId);
      });
    });
  },

  openCheckoutModal(billId) {
    const bill = State.bills.find(b => b.id === billId);
    if (!bill) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 650px;">
        <div class="modal-header">
          <h3>Checkout & Payment - Bill ${bill.id}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div style="font-size: 0.9rem;">
          <p><b>Customer:</b> ${Utils.escapeHtml(bill.customerName)}</p>
          <p><b>Designation:</b> ${bill.tableNumber ? 'Table ' + bill.tableNumber : 'Takeaway'}</p>
          
          <div style="margin: 1rem 0; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); padding: 0.5rem 0;">
            <b>Amount Due:</b> <span class="mono-price" style="font-size: 1.25rem; color: var(--color-burnt-orange);">${Utils.formatCurrency(bill.total)}</span>
          </div>

          <label>Cash Tendered (PHP)</label>
          <input type="number" step="0.01" id="cash-tendered" placeholder="0.00" required>
          
          <p style="margin-top: 0.5rem;"><b>Change:</b> <span class="mono-price" id="change-display" style="font-size: 1.1rem; color: green;">₱0.00</span></p>

          <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button class="btn btn-outline" id="cancel-checkout">Cancel</button>
            <button class="btn btn-orange" id="confirm-payment">Confirm Payment & Print Receipt</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#cancel-checkout').addEventListener('click', () => modal.remove());

    const cashInput = modal.querySelector('#cash-tendered');
    const changeDisplay = modal.querySelector('#change-display');

    cashInput.addEventListener('input', () => {
      const tendered = parseFloat(cashInput.value) || 0;
      const change = tendered - bill.total;
      changeDisplay.textContent = Utils.formatCurrency(change >= 0 ? change : 0);
    });

    modal.querySelector('#confirm-payment').addEventListener('click', () => {
      const tendered = parseFloat(cashInput.value) || 0;
      if (tendered < bill.total) {
        alert("Insufficient cash tendered.");
        return;
      }
      const change = tendered - bill.total;
      const paymentId = Utils.generateId('pay');
      const receiptNumber = 'REC-' + Math.floor(100000 + Math.random() * 900000);

      const paymentRecord = {
        id: paymentId,
        billId: bill.id,
        amountPaid: bill.total,
        cashTendered: tendered,
        change,
        paidAt: Utils.getCurrentDateTime()
      };

      let payments = State.payments;
      payments.push(paymentRecord);
      State.savePayments(payments);

      // Mark bill paid
      let bills = State.bills.map(b => b.id === bill.id ? { ...b, status: 'paid' } : b);
      State.saveBills(bills);

      // Generate receipt
      const receiptRecord = {
        id: Utils.generateId('rcpt'),
        receiptNumber,
        billId: bill.id,
        customerName: bill.customerName,
        tableNumber: bill.tableNumber,
        total: bill.total,
        cashTendered: tendered,
        change,
        paidAt: paymentRecord.paidAt
      };

      let receipts = State.receipts;
      receipts.push(receiptRecord);
      State.saveReceipts(receipts);

      // If table associated, release table
      if (bill.sessionId) {
        let session = State.sessions.find(s => s.id === bill.sessionId);
        if (session) {
          let tables = State.tables.map(t => t.id === session.tableId ? { ...t, status: 'available', customerName: '', sessionId: null } : t);
          State.saveTables(tables);
        }
      }

      modal.remove();
      Utils.showToast("Payment successful! Receipt generated.");
      
      // Open receipt view
      sessionStorage.setItem('active_receipt_id', receiptRecord.id);
      document.querySelector('[data-view="receipts"]').click();
    });
  }
};