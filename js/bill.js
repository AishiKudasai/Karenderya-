// BILL PAGE - the HTML is in bill.html, this file fills in the numbers
function drawPage() {
  if (current == null) { showPage('floor'); return; }
  var s = current;
  var bal = balance(s);
  document.getElementById('bill-title').textContent = 'Billing — ' + tableLabel(s) + ' · ' + s.name;
  if (s.pickupAt != undefined) { document.getElementById('bill-title').textContent += ' · Pickup ' + whenText(s.pickupAt); }

  // discount: every bill starts with NO discount. The button turns it on or off.
  var status = document.getElementById('discount-status');
  var button = document.getElementById('discount-button');
  if (s.discount > 0) {
    status.textContent = 'DISCOUNTED — ' + s.discount + '% off';
    status.className = 'tag-yes';
    button.textContent = 'Remove discount';
    button.className = 'light-button';
  } else {
    status.textContent = 'NO DISCOUNT';
    status.className = 'tag-none';
    button.textContent = 'Apply ' + data.shop.discount + '% discount';
    button.className = 'gold-button';
  }

  var rows = '';
  for (var i = 0; i < s.orders.length; i++) {
    var o = s.orders[i];
    if (o.status == 'Canceled') { continue; }
    for (var j = 0; j < o.items.length; j++) {
      var it = o.items[j];
      rows += '<tr><td>#' + pad(o.no) + '</td><td>' + safe(it.name) + '</td><td>' + it.qty + '</td><td>' + money(it.price * it.qty) + '</td></tr>';
    }
  }
  document.getElementById('bill-rows').innerHTML = rows;
  document.getElementById('bill-subtotal').textContent = money(subtotal(s));
  document.getElementById('bill-discount').textContent = '-' + money(discountAmount(s)) + ' (' + s.discount + '%)';
  document.getElementById('bill-due').textContent = money(amountDue(s));
  document.getElementById('bill-paid').textContent = money(paidSoFar(s));
  document.getElementById('bill-balance').textContent = money(bal);

  document.getElementById('payment-box').hidden = (bal <= 0);
  document.getElementById('finish-box').hidden = (bal > 0);
  if (bal > 0) {
    document.getElementById('collect').value = bal.toFixed(2);
    document.getElementById('cash').value = bal.toFixed(2);
    showChange();
  }
}

// one button: apply the discount rate from Setup, or remove it
function toggleDiscount() {
  if (current.discount > 0) {
    current.discount = 0;
  } else {
    var rate = data.shop.discount;
    if (rate <= 0) { alert('The discount rate is 0%. Please set it in Setup first.'); return; }
    var newDue = subtotal(current) - subtotal(current) * rate / 100;
    if (round2(newDue) < paidSoFar(current)) { alert('The customer already paid more than the discounted total.'); return; }
    current.discount = rate;
  }
  saveData();
  drawPage();
}

function showChange() {
  var collect = parseFloat(document.getElementById('collect').value);
  var cash = parseFloat(document.getElementById('cash').value);
  var text = '';
  if (isNaN(collect) || isNaN(cash)) { text = ''; }
  else if (cash >= collect) { text = 'Change: ' + money(round2(cash - collect)); }
  else { text = 'Short by ' + money(round2(collect - cash)); }
  document.getElementById('change').textContent = text;
}

function payNow() {
  var s = current;
  var collect = round2(parseFloat(document.getElementById('collect').value));
  var cash = round2(parseFloat(document.getElementById('cash').value));
  if (isNaN(collect) || collect <= 0) { alert('Type the amount to collect.'); return; }
  if (isNaN(cash)) { alert('Type the cash received.'); return; }
  if (collect > balance(s)) { alert('That is more than the balance.'); return; }
  if (cash < collect) { alert('The cash received is not enough.'); return; }
  document.getElementById('pay-button').disabled = true;   // stops double clicking
  s.payments.push(collect);
  data.receiptCount++;

  // join the same food from all orders into one receipt line
  var lines = [];
  var orderNos = [];
  for (var i = 0; i < s.orders.length; i++) {
    if (s.orders[i].status == 'Canceled') { continue; }
    orderNos.push(s.orders[i].no);
    for (var j = 0; j < s.orders[i].items.length; j++) {
      var it = s.orders[i].items[j];
      var same = null;
      for (var k = 0; k < lines.length; k++) {
        if (lines[k].name == it.name && lines[k].price == it.price) { same = lines[k]; }
      }
      if (same == null) { lines.push({name: it.name, price: it.price, qty: it.qty}); }
      else { same.qty += it.qty; }
    }
  }
  var bal = balance(s);
  var receipt = {
    no: 'R-' + pad(data.receiptCount), date: new Date().toLocaleString('en-PH'), cashier: data.shop.cashier,
    shop: {name: data.shop.name, address: data.shop.address, phone: data.shop.phone, footer: data.shop.footer},
    orderNos: orderNos, lines: lines, subtotal: subtotal(s), discount: discountAmount(s), percent: s.discount, due: amountDue(s),
    collected: collect, cash: cash, change: round2(cash - collect), paidTotal: paidSoFar(s),
    balance: bal, partial: (bal > 0)
  };
  data.receipts.push(receipt);
  saveData();
  setLastReceipt(data.receipts.length - 1, 'checkout');
  showPage('receipt');
}