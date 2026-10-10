import { State } from './state.js';
import { Utils } from './utils.js';

export const ReceiptsModule = {
  render(container) {
    const activeReceiptId = sessionStorage.getItem('active_receipt_id');
    sessionStorage.removeItem('active_receipt_id');

    const receipts = State.receipts;

    container.innerHTML = `
      <h2>Receipt History & Generation</h2>
      ${activeReceiptId ? this.getReceiptHTML(receipts.find(r => r.id === activeReceiptId)) : ''}
      <div class="card" style="margin-top: 1rem;">
        <h3>All Issued Receipts</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Customer</th>
              <th>Table / Type</th>
              <th>Total Amount</th>
              <th>Date / Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${receipts.slice().reverse().map(r => `
              <tr>
                <td><b>${r.receiptNumber}</b></td>
                <td>${Utils.escapeHtml(r.customerName)}</td>
                <td>${r.tableNumber ? 'Table ' + r.tableNumber : 'Takeaway'}</td>
                <td class="mono-price">${Utils.formatCurrency(r.total)}</td>
                <td>${r.paidAt}</td>
                <td>
                  <button class="btn btn-outline view-rcpt-btn" data-id="${r.id}" style="padding:0.2rem 0.5rem; font-size:0.8rem;">View / Print</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.view-rcpt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rcpt = State.receipts.find(x => x.id === id);
        if (rcpt) {
          const prevArea = container.querySelector('.printable-receipt');
          if (prevArea) prevArea.remove();
          container.insertAdjacentHTML('afterbegin', this.getReceiptHTML(rcpt));
        }
      });
    });

    if (activeReceiptId) {
      window.print();
    }
  },

  getReceiptHTML(rcpt) {
    if (!rcpt) return '';
    const settings = State.settings;
    const bill = State.bills.find(b => b.id === rcpt.billId);
    let orders = [];
    if (bill && bill.orders) {
      orders = State.orders.filter(o => bill.orders.includes(o.id));
    }

    return `
      <div class="card printable-receipt" style="max-width: 400px; margin: 1rem auto; font-family: var(--font-mono);">
        <div style="text-align: center; margin-bottom: 1rem;">
          <h3>${Utils.escapeHtml(settings.restaurantName)}</h3>
          <p style="font-size:0.75rem;">${Utils.escapeHtml(settings.address)}</p>
          <p style="font-size:0.75rem;">Contact: ${Utils.escapeHtml(settings.contact)}</p>
        </div>
        <hr style="border: dashed 1px #000; margin: 0.5rem 0;">
        <div style="font-size: 0.8rem;">
          <p><b>Receipt #:</b> ${rcpt.receiptNumber}</p>
          <p><b>Date:</b> ${rcpt.paidAt}</p>
          <p><b>Customer:</b> ${Utils.escapeHtml(rcpt.customerName)}</p>
          <p><b>Designation:</b> ${rcpt.tableNumber ? 'Table ' + rcpt.tableNumber : 'Takeaway'}</p>
          <p><b>Cashier:</b> ${Utils.escapeHtml(settings.staffName)}</p>
        </div>
        <hr style="border: dashed 1px #000; margin: 0.5rem 0;">
        <div style="font-size: 0.8rem;">
          ${orders.flatMap(o => o.items).map(i => `
            <div style="display:flex; justify-content:space-between; margin-bottom: 0.2rem;">
              <span>${i.qty}x${Utils.escapeHtml(i.name)}</span>
              <span>${Utils.formatCurrency(i.price * i.qty)}</span>
            </div>
          `).join('')}
        </div>
        <hr style="border: dashed 1px #000; margin: 0.5rem 0;">
        <div style="font-size: 0.85rem;">
          <div style="display:flex; justify-content:space-between; font-weight:bold;">
            <span>TOTAL DUE:</span>
            <span>${Utils.formatCurrency(rcpt.total)}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Cash Tendered:</span>
            <span>${Utils.formatCurrency(rcpt.cashTendered)}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Change:</span>
            <span>${Utils.formatCurrency(rcpt.change)}</span>
          </div>
        </div>
        <hr style="border: dashed 1px #000; margin: 0.5rem 0;">
        <div style="text-align: center; font-size: 0.75rem; margin-top: 1rem;">
          <p>${Utils.escapeHtml(settings.receiptFooter)}</p>
        </div>
        <div style="margin-top: 1rem; display:flex; gap:0.5rem;" class="no-print">
          <button class="btn" onclick="window.print()" style="flex:1;">Print Receipt</button>
        </div>
      </div>
    `;
  }
};