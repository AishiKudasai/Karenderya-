// COMMON CODE - every page uses this file
var data;
var current = null;          // the table / takeaway being worked on
var lastReceipt = null;
var receiptFrom = 'checkout';

function saveData() {
  localStorage.setItem('karenderya', JSON.stringify(data));
}

function loadData() {
  var saved = localStorage.getItem('karenderya');
  if (saved != null) {
    data = JSON.parse(saved);
    startApp();
    return;
  }
  // first time: read the starting data from database.json
  fetch('database.json')
    .then(function (response) { return response.json(); })
    .then(function (json) { data = json; saveData(); startApp(); })
    .catch(function () { alert('Cannot read database.json. Please open the project with VS Code Live Server.'); });
}

function startApp() {
  if (data.shop.discount == undefined) { data.shop.discount = 20; }   // discount rate used by the Discount button
  if (data.reservations == undefined) { data.reservations = []; }
  var c = localStorage.getItem('karenderya-current');
  if (c != null && data.sessions[parseInt(c)] != undefined && data.sessions[parseInt(c)].closed == false) {
    current = data.sessions[parseInt(c)];
  }
  var r = localStorage.getItem('karenderya-receipt');
  if (r != null && data.receipts[parseInt(r)] != undefined) { lastReceipt = data.receipts[parseInt(r)]; }
  var from = localStorage.getItem('karenderya-from');
  if (from != null) { receiptFrom = from; }
  drawBar();
  drawPage();
  setInterval(drawBar, 30000);
}

// the floor page is now index.html
function showPage(name) {
  if (name == 'floor') { name = 'index'; }
  window.location.href = name + '.html';
}

function setCurrent(s) {
  current = s;
  if (s == null) { localStorage.removeItem('karenderya-current'); }
  else { localStorage.setItem('karenderya-current', data.sessions.indexOf(s)); }
}

function setLastReceipt(i, from) {
  lastReceipt = data.receipts[i];
  receiptFrom = from;
  localStorage.setItem('karenderya-receipt', i);
  localStorage.setItem('karenderya-from', from);
}

// ----- small helpers -----
function money(n) { return '₱' + n.toFixed(2); }
function round2(n) { return Math.round(n * 100) / 100; }
function safe(text) {
  text = String(text);
  text = text.split('&').join('&amp;');
  text = text.split('<').join('&lt;');
  text = text.split('>').join('&gt;');
  text = text.split('"').join('&quot;');
  return text;
}
function pad(n) { var s = String(n); while (s.length < 4) { s = '0' + s; } return s; }
// ----- date helpers -----
function two(n) { if (n < 10) { return '0' + n; } return String(n); }

// milliseconds -> text for <input type="datetime-local">
function toInput(ms) {
  var d = new Date(ms);
  return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()) + 'T' + two(d.getHours()) + ':' + two(d.getMinutes());
}

// milliseconds -> easy to read text, example: Mon, Oct 12, 6:30 PM
function whenText(ms) {
  return new Date(ms).toLocaleString('en-PH', {weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
}

function tableLabel(s) { if (s.table == 'Takeaway') { return 'Takeaway'; } return 'Table ' + s.table; }

// ----- MONEY MATH (simple) -----
// subtotal = all food (without canceled orders)
// discount = subtotal x percent / 100      (s.discount is 0 when there is no discount)
// due      = subtotal - discount
// balance  = due - paid so far
function orderTotal(order) {
  var total = 0;
  for (var i = 0; i < order.items.length; i++) { total += order.items[i].price * order.items[i].qty; }
  return total;
}
function subtotal(s) {
  var total = 0;
  for (var i = 0; i < s.orders.length; i++) {
    if (s.orders[i].status != 'Canceled') { total += orderTotal(s.orders[i]); }
  }
  return round2(total);
}
function discountAmount(s) { return round2(subtotal(s) * s.discount / 100); }
function amountDue(s) { return subtotal(s) - discountAmount(s); }
function paidSoFar(s) {
  var total = 0;
  for (var i = 0; i < s.payments.length; i++) { total += s.payments[i]; }
  return total;
}
function balance(s) { return round2(amountDue(s) - paidSoFar(s)); }

function findOpenByTable(no) {
  for (var i = 0; i < data.sessions.length; i++) {
    if (data.sessions[i].table == no && data.sessions[i].closed == false) { return data.sessions[i]; }
  }
  return null;
}

function findTable(no) {
  for (var i = 0; i < data.tables.length; i++) {
    if (data.tables[i].no == no) { return data.tables[i]; }
  }
  return null;
}

// index of the next active reservation of a table (-1 if none)
function reservationFor(no) {
  var best = -1;
  for (var i = 0; i < data.reservations.length; i++) {
    var r = data.reservations[i];
    if (r.table == no && r.status == 'Active') {
      if (best == -1 || r.at < data.reservations[best].at) { best = i; }
    }
  }
  return best;
}

// ----- top bar (the HTML is in each page, JS only fills the text) -----
function drawBar() {
  document.getElementById('shop-name').textContent = data.shop.name.toUpperCase();
  document.getElementById('date-time').textContent = new Date().toLocaleString('en-PH');
  document.getElementById('cashier-name').textContent = data.shop.cashier;
}

// + Takeaway: the pop-up box lives on the floor page (index.html)
function newTakeaway() {
  if (document.getElementById('table-box') == null) {
    localStorage.setItem('karenderya-takeaway', 'yes');   // the floor page opens the box
    showPage('floor');
    return;
  }
  openTakeawayBox();
}

// every new table starts with NO discount (discount: 0). The Bill page has a button to apply it.
function newSession(tableNo, name) {
  var s = {table: tableNo, name: name, openedAt: Date.now(), orders: [], payments: [], discount: 0, draft: [], closed: false};
  data.sessions.push(s);
  saveData();
  return s;
}

function finishCheckout() {
  if (balance(current) > 0) { alert('There is still an unpaid balance.'); return; }
  current.closed = true;
  for (var i = 0; i < current.orders.length; i++) {
    if (current.orders[i].status != 'Canceled') { current.orders[i].status = 'Completed'; }
  }
  setCurrent(null);
  saveData();
  alert('Checkout complete. The table is free again.');
  showPage('floor');
}