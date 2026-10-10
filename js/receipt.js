// RECEIPT PAGE - the receipt layout is in receipt.html, this file fills in the numbers
function drawPage() {
  if (lastReceipt == null) { showPage('receipts'); return; }
  var r = lastReceipt;
  var title = 'Receipt ' + r.no;
  if (receiptFrom == 'checkout') { title = 'Payment recorded — change ' + money(r.change); }
  document.getElementById('receipt-title').textContent = title;
  document.getElementById('r-shop').textContent = r.shop.name;
  document.getElementById('r-address').textContent = r.shop.address;
  document.getElementById('r-phone').textContent = r.shop.phone;
  if (r.partial) { document.getElementById('r-heading').textContent = 'PAYMENT RECEIPT (PARTIAL)'; }
  else { document.getElementById('r-heading').textContent = 'OFFICIAL RECEIPT'; }
  document.getElementById('r-no').textContent = r.no;
  var nos = '';
  for (var i = 0; i < r.orderNos.length; i++) { nos += '#' + pad(r.orderNos[i]) + ' '; }
  document.getElementById('r-orders').textContent = nos;
  document.getElementById('r-date').textContent = r.date;
  document.getElementById('r-cashier').textContent = r.cashier;

  var rows = '';
  for (var j = 0; j < r.lines.length; j++) {
    var l = r.lines[j];
    rows += '<tr><td>' + safe(l.name) + '<br>&nbsp;' + l.qty + ' x ' + money(l.price) + '</td><td>' + money(l.qty * l.price) + '</td></tr>';
  }
  document.getElementById('r-items').innerHTML = rows;
  document.getElementById('r-subtotal').textContent = money(r.subtotal);
  document.getElementById('r-discount').textContent = '-' + money(r.discount);
  if (r.percent != undefined && r.percent > 0) { document.getElementById('r-discount').textContent += ' (' + r.percent + '%)'; }
  if (r.percent != undefined && r.percent > 0) { document.getElementById('r-discount-status').textContent = 'DISCOUNTED (' + r.percent + '% off)'; }
  else { document.getElementById('r-discount-status').textContent = 'NO DISCOUNT'; }
  document.getElementById('r-due').textContent = money(r.due);
  document.getElementById('r-paid').textContent = money(r.collected);
  document.getElementById('r-cash').textContent = money(r.cash);
  document.getElementById('r-change').textContent = money(r.change);
  document.getElementById('r-total-paid').textContent = money(r.paidTotal);
  document.getElementById('r-balance').textContent = money(r.balance);
  document.getElementById('r-footer').textContent = r.shop.footer;

  var fromCheckout = (receiptFrom == 'checkout');
  document.getElementById('back-history').hidden = fromCheckout;
  document.getElementById('back-table').hidden = !(fromCheckout && r.partial);
  document.getElementById('finish-button').hidden = !(fromCheckout && !r.partial);
  if (fromCheckout == false) {   // highlight "Receipts" in the side menu
    document.getElementById('link-floor').className = '';
    document.getElementById('link-receipts').className = 'active';
  }
}

function downloadReceipt() {
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:monospace;font-size:12px}table{width:300px;border-collapse:collapse}td:last-child{text-align:right}</style></head><body>' +
             document.getElementById('receipt-paper').outerHTML + '</body></html>';
  var link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([html], {type: 'text/html'}));
  link.download = lastReceipt.no + '.html';
  link.click();
}