// ORDER PAGE - the HTML is in order.html, this file fills in the food and the ticket
var categoryList = [];
var category = 'All';
var search = '';

function drawPage() {
  if (current == null) { showPage('index'); return; }
  categoryList = ['All'];
  for (var i = 0; i < data.menu.length; i++) {
    if (categoryList.indexOf(data.menu[i].category) == -1) { categoryList.push(data.menu[i].category); }
  }
  drawCategories();
  drawFood();
  drawTicket();
}

function drawCategories() {
  var h = '';
  for (var c = 0; c < categoryList.length; c++) {
    var cls = '';
    if (categoryList[c] == category) { cls = 'active'; }
    h += '<button class="' + cls + '" onclick="pickCategory(' + c + ')">' + safe(categoryList[c]) + '</button>';
  }
  document.getElementById('category-list').innerHTML = h;
}

function pickCategory(c) { category = categoryList[c]; drawCategories(); drawFood(); }
function onSearch() { search = document.getElementById('search-box').value; drawFood(); }

function drawFood() {
  var h = '';
  for (var i = 0; i < data.menu.length; i++) {
    var m = data.menu[i];
    var okCategory = (category == 'All' || m.category == category);
    var okSearch = (m.name.toLowerCase().indexOf(search.toLowerCase()) != -1);
    if (okCategory && okSearch) {
      var img = '';
      if (m.image != '') { img = '<img src="' + safe(m.image) + '" onerror="this.style.display=\'none\'">'; }
      var cls = 'food-card';
      if (m.available == false) { cls = 'food-card unavailable'; }
      h += '<button class="' + cls + '" onclick="addFood(' + i + ')"><span class="food-picture">' + safe(m.name.charAt(0)) + img + '</span>' +
           '<strong>' + safe(m.name) + '</strong><span class="price">' + money(m.price) + '</span></button>';
    }
  }
  if (h == '') { h = '<p>No food found.</p>'; }
  document.getElementById('food-grid').innerHTML = h;
}

function addFood(i) {
  var m = data.menu[i];
  if (m.available == false) { alert(m.name + ' is not available.'); return; }
  var found = false;
  for (var k = 0; k < current.draft.length; k++) {
    if (current.draft[k].name == m.name && current.draft[k].note == '') { current.draft[k].qty++; found = true; }
  }
  if (found == false) { current.draft.push({name: m.name, price: m.price, qty: 1, note: ''}); }
  saveData();
  drawTicket();
}

function drawTicket() {
  var s = current;
  document.getElementById('ticket-title').textContent = tableLabel(s) + ' · ' + s.name;
  document.getElementById('ticket-total').textContent = 'Tab so far: ' + money(subtotal(s));

  var sent = '';
  for (var i = 0; i < s.orders.length; i++) {
    var o = s.orders[i];
    var names = '';
    for (var j = 0; j < o.items.length; j++) { names += o.items[j].qty + '× ' + safe(o.items[j].name) + ' '; }
    sent += '<li>#' + pad(o.no) + ' ' + names + '<span class="status ' + o.status.toLowerCase() + '">' + o.status + '</span></li>';
  }
  if (sent == '') { sent = '<li class="muted">Nothing sent yet.</li>'; }
  document.getElementById('sent-list').innerHTML = sent;

  var list = '';
  var newTotal = 0;
  for (var d = 0; d < s.draft.length; d++) {
    var it = s.draft[d];
    newTotal += it.price * it.qty;
    list += '<li><strong>' + safe(it.name) + '</strong><span class="price">' + money(it.price * it.qty) + '</span><br>' +
            '<button class="small light-button" onclick="changeQty(' + d + ',-1)">−</button> ' + it.qty +
            ' <button class="small light-button" onclick="changeQty(' + d + ',1)">+</button> ' +
            '<button class="small light-button" onclick="addNote(' + d + ')">note</button> ' +
            '<button class="small light-button" onclick="removeDraft(' + d + ')">remove</button>';
    if (it.note != '') { list += '<br><small>Note: ' + safe(it.note) + '</small>'; }
    list += '</li>';
  }
  if (list == '') { list = '<li class="muted">Tap food to add.</li>'; }
  document.getElementById('new-list').innerHTML = list;
  document.getElementById('new-total').textContent = money(newTotal);
}

function changeQty(d, change) {
  current.draft[d].qty += change;
  if (current.draft[d].qty < 1) { current.draft.splice(d, 1); }
  saveData(); drawTicket();
}
function removeDraft(d) { current.draft.splice(d, 1); saveData(); drawTicket(); }
function addNote(d) {
  var note = prompt('Special instructions:', current.draft[d].note);
  if (note != null) { current.draft[d].note = note; saveData(); drawTicket(); }
}
function clearDraft() {
  if (current.draft.length == 0) { return; }
  if (confirm('Clear the new order?')) { current.draft = []; saveData(); drawTicket(); }
}

function sendOrder() {
  if (current.draft.length == 0) { alert('Add some food first.'); return; }
  data.orderCount++;
  current.orders.push({no: data.orderCount, items: current.draft, status: 'Pending', reason: ''});
  current.draft = [];
  saveData();
  alert('Order sent! The table stays open so the customer can order more.');
  showPage('index');
}

function goBill() {
  if (subtotal(current) == 0) { alert('There is nothing to bill yet. Send an order first.'); return; }
  if (current.draft.length > 0) {
    if (confirm('You have an order that was not sent. Go to billing anyway?') == false) { return; }
  }
  showPage('bill');
}
