// SETTINGS PAGE
function drawPage() {
  var keys = ['name', 'address', 'phone', 'cashier', 'footer'];
  for (var k = 0; k < keys.length; k++) {
    document.getElementById('set-' + keys[k]).textContent = data.shop[keys[k]];
  }
  document.getElementById('set-discount').textContent = data.shop.discount + '%';
  var rows = '';
  for (var i = 0; i < data.tables.length; i++) {
    rows += '<tr><td>Table ' + safe(data.tables[i].no) + '</td><td>seats ' + data.tables[i].seats + '</td>' +
            '<td><button class="small light-button" onclick="removeTable(' + i + ')">Remove</button></td></tr>';
  }
  document.getElementById('table-rows').innerHTML = rows;
}

function editShop(field) {
  var value = prompt('New value:', data.shop[field]);
  if (value == null || value == '') { return; }
  data.shop[field] = value;
  saveData(); drawPage(); drawBar();
}

// the rate used by the Discount button on the Bill page
function editDiscount() {
  var value = prompt('Discount rate in percent, 1 to 100 (example: 20):', data.shop.discount);
  if (value == null) { return; }
  var percent = parseFloat(value);
  if (isNaN(percent) || percent < 0 || percent > 100) { alert('Please type a percent from 0 to 100.'); return; }
  data.shop.discount = percent;
  saveData(); drawPage();
}

function addTable() {
  var no = prompt('Table number or name:');
  if (no == null || no == '') { return; }
  for (var i = 0; i < data.tables.length; i++) {
    if (data.tables[i].no == no) { alert('That table already exists.'); return; }
  }
  var seats = parseInt(prompt('How many seats?', '4'));
  if (isNaN(seats) || seats < 1) { alert('Invalid number.'); return; }
  data.tables.push({no: no, seats: seats});
  saveData(); drawPage();
}

function removeTable(i) {
  if (findOpenByTable(data.tables[i].no) != null) { alert('This table has an open order.'); return; }
  if (reservationFor(data.tables[i].no) != -1) { alert('This table has a reservation.'); return; }
  if (confirm('Remove this table?')) { data.tables.splice(i, 1); saveData(); drawPage(); }
}

function resetAll() {
  if (confirm('This erases ALL orders, receipts and settings. Continue?')) {
    localStorage.removeItem('karenderya');
    localStorage.removeItem('karenderya-current');
    location.reload();
  }
}