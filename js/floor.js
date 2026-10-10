// FLOOR PAGE - the HTML is in index.html, this file fills in the tables and the pop-up box
var boxTable = null;     // the table shown in the pop-up box
var boxMode = 'seat';    // 'seat' or 'reserve'
var boxEditing = -1;     // number of the reservation being edited (-1 = none)

function drawPage() {
  var tiles = '';
  for (var i = 0; i < data.tables.length; i++) {
    var t = data.tables[i];
    var s = findOpenByTable(t.no);
    var r = reservationFor(t.no);
    var badge = '<b class="seat-badge">' + t.seats + ' seats</b>';
    var number = '<strong class="table-number">' + safe(t.no) + '</strong>';
    if (s != null) {
      var mins = Math.floor((Date.now() - s.openedAt) / 60000);
      tiles += '<button class="table-tile taken" onclick="clickTable(' + i + ')">' + badge + number + '<b class="state">Occupied</b>' +
               '<small>' + safe(s.name) + '</small><small>' + mins + ' min · ' + s.orders.length + ' order(s)</small>' +
               '<b class="bill-amount">' + money(subtotal(s)) + '</b></button>';
    } else if (r != -1) {
      var res = data.reservations[r];
      tiles += '<button class="table-tile reserved" onclick="clickTable(' + i + ')">' + badge + number + '<b class="state">Reserved</b>' +
               '<small>' + safe(res.name) + '</small><small>' + whenText(res.at) + '</small>' +
               '<b class="bill-amount">' + res.guests + ' pax</b></button>';
    } else {
      tiles += '<button class="table-tile free" onclick="clickTable(' + i + ')">' + badge + number + '<b class="state">Available</b>' +
               '<small>Tap to seat or reserve</small></button>';
    }
  }
  document.getElementById('table-board').innerHTML = tiles;

  var takeaways = '';
  for (var j = 0; j < data.sessions.length; j++) {
    var k = data.sessions[j];
    if (k.table == 'Takeaway' && k.closed == false) {
      var pickup = '';
      if (k.pickupAt != undefined) { pickup = '<small>Pickup ' + whenText(k.pickupAt) + '</small>'; }
      takeaways += '<button class="table-tile taken" onclick="openSession(' + j + ')"><b class="seat-badge">Takeaway</b>' +
                   '<strong class="table-number">TO GO</strong><b class="state">Open</b><small>' + safe(k.name) + '</small>' + pickup +
                   '<b class="bill-amount">' + money(subtotal(k)) + '</b></button>';
    }
  }
  document.getElementById('takeaway-board').innerHTML = takeaways;
  document.getElementById('takeaway-area').hidden = (takeaways == '');

  var rows = '';
  for (var m = 0; m < data.reservations.length; m++) {
    var x = data.reservations[m];
    if (x.status == 'Active') {
      rows += '<tr><td>Table ' + safe(x.table) + '</td><td>' + safe(x.name) + '</td><td>' + x.guests + '</td><td>' + whenText(x.at) +
              '</td><td><button class="small light-button" onclick="editReservation(' + m + ')">Edit</button> <button class="small light-button" onclick="cancelReservation(' + m + ')">Cancel</button></td></tr>';
    }
  }
  document.getElementById('reservation-rows').innerHTML = rows;
  document.getElementById('reservation-area').hidden = (rows == '');

  // "+ Takeaway" was pressed on another page
  if (localStorage.getItem('karenderya-takeaway') == 'yes') {
    localStorage.removeItem('karenderya-takeaway');
    openTakeawayBox();
  }
}

// ----- tapping a table -----
function clickTable(i) {
  var t = data.tables[i];
  var s = findOpenByTable(t.no);
  if (s != null) { setCurrent(s); showPage('order'); return; }
  var r = reservationFor(t.no);
  if (r != -1) { openReservedBox(t, r); return; }
  openFreeBox(t, 'seat', -1);
}

function openSession(i) { setCurrent(data.sessions[i]); showPage('order'); }

// ----- pop-up box -----
function openFreeBox(t, mode, editIndex) {
  boxTable = t;
  boxEditing = editIndex;
  document.getElementById('box-title').textContent = 'Table ' + t.no;
  document.getElementById('box-info').textContent = 'Seats up to ' + t.seats + ' guests';
  document.getElementById('box-free').hidden = false;
  document.getElementById('box-reserved').hidden = true;
  document.getElementById('table-box').hidden = false;
  document.getElementById('box-guests').max = t.seats;
  if (editIndex == -1) {
    document.getElementById('box-name').value = '';
    document.getElementById('box-guests').value = '';
    document.getElementById('box-when').value = '';
  } else {
    var x = data.reservations[editIndex];
    document.getElementById('box-name').value = x.name;
    document.getElementById('box-guests').value = x.guests;
    document.getElementById('box-when').value = toInput(x.at);
  }
  document.getElementById('box-tabs').hidden = (editIndex != -1);
  showTab(mode);
}

function openReservedBox(t, r) {
  var res = data.reservations[r];
  boxTable = t;
  boxEditing = r;
  document.getElementById('box-title').textContent = 'Table ' + t.no + ' — Reserved';
  document.getElementById('box-info').textContent = res.name + ' · ' + res.guests + ' pax · ' + whenText(res.at);
  document.getElementById('box-free').hidden = true;
  document.getElementById('box-reserved').hidden = false;
  document.getElementById('table-box').hidden = false;
}

function closeBox() {
  document.getElementById('table-box').hidden = true;
  boxTable = null;
  boxEditing = -1;
}

function showTab(mode) {
  boxMode = mode;
  var seatTab = document.getElementById('tab-seat');
  var reserveTab = document.getElementById('tab-reserve');
  seatTab.className = 'light-button tab';
  reserveTab.className = 'light-button tab';
  if (mode == 'seat') { seatTab.className = 'light-button tab active'; }
  else { reserveTab.className = 'light-button tab active'; }

  document.getElementById('when-area').hidden = (mode == 'seat');
  document.getElementById('guests-area').hidden = false;
  document.getElementById('when-label').textContent = 'Date and time';
  document.getElementById('quick-now').hidden = true;
  document.getElementById('quick-30').hidden = true;
  if (mode == 'seat') { document.getElementById('box-save').textContent = 'Seat customer'; }
  else if (boxEditing == -1) { document.getElementById('box-save').textContent = 'Save reservation'; }
  else { document.getElementById('box-save').textContent = 'Save changes'; }

  document.getElementById('box-when').min = toInput(Date.now());
  if (mode == 'reserve' && document.getElementById('box-when').value == '') { quickTime('hour1'); }
  document.getElementById('box-error').textContent = '';
  showWhen();
}

// quick buttons fill in the date and time for you
function quickTime(kind) {
  var d = new Date();
  if (kind == 'now') { d = new Date(); }
  else if (kind == 'min30') { d = new Date(Date.now() + 30 * 60000); }
  else if (kind == 'hour1') { d = new Date(Date.now() + 60 * 60000); }
  else if (kind == 'hour2') { d = new Date(Date.now() + 120 * 60000); }
  else if (kind == 'today6') { d.setHours(18, 0, 0, 0); }
  else if (kind == 'tom12') { d.setDate(d.getDate() + 1); d.setHours(12, 0, 0, 0); }
  else if (kind == 'tom6') { d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0); }
  d.setSeconds(0, 0);
  document.getElementById('box-when').value = toInput(d.getTime());
  showWhen();
}

function showWhen() {
  var at = new Date(document.getElementById('box-when').value).getTime();
  var text = '';
  if (isNaN(at) == false) { text = 'Reservation: ' + whenText(at); }
  document.getElementById('when-preview').textContent = text;
}

function showError(text) { document.getElementById('box-error').textContent = text; }

function saveBox() {
  var name = document.getElementById('box-name').value.trim();
  if (boxMode == 'takeaway') { saveTakeaway(name); return; }
  var guests = parseInt(document.getElementById('box-guests').value);
  if (isNaN(guests) || guests < 1) { showError('Please type how many guests.'); return; }
  if (guests > boxTable.seats) { showError('This table only seats ' + boxTable.seats + '.'); return; }

  if (boxMode == 'seat') {
    if (name == '') { name = 'Walk-in'; }
    setCurrent(newSession(boxTable.no, name));
    showPage('order');
    return;
  }

  // reserve
  if (name == '') { showError('Please type the reservation name.'); return; }
  var at = new Date(document.getElementById('box-when').value).getTime();
  if (isNaN(at)) { showError('Please pick the date and time.'); return; }
  if (at < Date.now()) { showError('That time has already passed.'); return; }
  for (var i = 0; i < data.reservations.length; i++) {
    var x = data.reservations[i];
    if (i != boxEditing && x.status == 'Active' && x.table == boxTable.no && Math.abs(x.at - at) < 2 * 60 * 60 * 1000) {
      showError('Table ' + boxTable.no + ' is already reserved on ' + whenText(x.at) + '. Pick a time at least 2 hours apart.');
      return;
    }
  }
  if (boxEditing == -1) {
    data.reservations.push({table: boxTable.no, name: name, guests: guests, at: at, status: 'Active'});
  } else {
    var res = data.reservations[boxEditing];
    res.name = name; res.guests = guests; res.at = at;
  }
  saveData();
  closeBox();
  drawPage();
}

// ----- takeaway: name + pickup date and time -----
function openTakeawayBox() {
  boxTable = null;
  boxEditing = -1;
  boxMode = 'takeaway';
  document.getElementById('box-title').textContent = 'Takeaway';
  document.getElementById('box-info').textContent = 'When will the customer pick it up?';
  document.getElementById('box-free').hidden = false;
  document.getElementById('box-reserved').hidden = true;
  document.getElementById('table-box').hidden = false;
  document.getElementById('box-tabs').hidden = true;
  document.getElementById('guests-area').hidden = true;
  document.getElementById('when-area').hidden = false;
  document.getElementById('when-label').textContent = 'Pickup date and time';
  document.getElementById('quick-now').hidden = false;
  document.getElementById('quick-30').hidden = false;
  document.getElementById('box-save').textContent = 'Start takeaway order';
  document.getElementById('box-name').value = '';
  document.getElementById('box-when').min = toInput(Date.now());
  document.getElementById('box-error').textContent = '';
  quickTime('min30');
}

function saveTakeaway(name) {
  if (name == '') { name = 'Walk-in'; }
  var at = new Date(document.getElementById('box-when').value).getTime();
  if (isNaN(at)) { showError('Please pick the pickup date and time.'); return; }
  if (at < Date.now() - 5 * 60000) { showError('That time has already passed.'); return; }
  var s = newSession('Takeaway', name);
  s.pickupAt = at;
  setCurrent(s);
  saveData();
  showPage('order');
}

// ----- buttons for a reserved table -----
function seatReserved() {
  var res = data.reservations[boxEditing];
  res.status = 'Seated';
  setCurrent(newSession(boxTable.no, res.name));   // newSession saves the data
  showPage('order');
}

function editFromBox() { openFreeBox(boxTable, 'reserve', boxEditing); }
function cancelFromBox() { cancelReservation(boxEditing); }

// ----- reservation list at the bottom of the page -----
function editReservation(k) {
  var t = findTable(data.reservations[k].table);
  if (t != null) { openFreeBox(t, 'reserve', k); }
}

function cancelReservation(k) {
  if (confirm('Cancel this reservation?')) {
    data.reservations[k].status = 'Canceled';
    saveData();
    closeBox();
    drawPage();
  }
}

// press Esc to close the box
document.addEventListener('keydown', function (e) {
  if (e.key == 'Escape') { closeBox(); }
});