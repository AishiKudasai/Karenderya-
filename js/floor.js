// ===== floor.js: the table board =====

var pickedTable = "";   // the table number shown in the pop-up
var mode = "seat";      // "seat" or "reserve"
var editingId = 0;      // id of the reservation being edited (0 = new one)
var reservedId = 0;     // id of the reservation shown in the pop-up

function startPage() {
  drawFloor();
}

// Find the open customer sitting at a table (or nothing)
function findOpen(no) {
  for (let session of data.sessions) {
    if (session.table == no && session.status == "open") {
      return session;
    }
  }
  return null;
}

// Find the reservation of a table (or nothing)
function findReservation(no) {
  for (let reservation of data.reservations) {
    if (reservation.table == no) {
      return reservation;
    }
  }
  return null;
}

// Make a new customer and save it
function makeSession(table, name, guests) {
  let session = {
    id: data.sessions.length + 1,
    table: table,
    name: name,
    guests: guests,
    status: "open",
    orders: [],
    draft: [],
    discount: false,
    paid: 0
  };
  data.sessions.push(session);
  saveData();
  return session;
}

// Remember who we are working on, then open the order page
function goOrder(id) {
  localStorage.setItem("currentId", id);
  showPage("order");
}

// Default picture: 4 seats or fewer use the small table, more use the big table
function defaultTableImage(seats) {
  if (seats <= 4) {
    return "images/table-1.jpg";
  }
  return "images/table-2.jpg";
}

// The picture of one table: its own picture if you set one in Settings, if not the default
function tableImage(table) {
  if (table.image != undefined && table.image != "") {
    return table.image;
  }
  return defaultTableImage(table.seats);
}

// Which filter button is selected: all, free, pending, placed, bill or reserved
var filter = "all";

// The words shown on the card for each kind of table
var words = {
  free: "Available",
  reserved: "Reserved",
  pending: "Occupied - Order pending",
  placed: "Occupied - Order placed",
  bill: "Occupied - Needs bill"
};

// What is happening with a customer who is seated?
// pending = seated, nothing ordered yet
// placed  = food was ordered, but not everything is served yet
// bill    = everything is served, the customer is waiting for the bill
function sessionKind(session) {
  let sent = 0;        // orders sent to the kitchen
  let notServed = 0;   // orders that are not served yet
  for (let order of session.orders) {
    if (order.status != "canceled") {
      sent = sent + 1;
      if (order.status != "served") {
        notServed = notServed + 1;
      }
    }
  }
  if (sent == 0) {
    return "pending";
  }
  if (notServed > 0) {
    return "placed";
  }
  return "bill";
}

// What is happening with a table? free, reserved, pending, placed or bill
function kindOf(no) {
  let session = findOpen(no);
  if (session != null) {
    return sessionKind(session);
  }
  if (findReservation(no) != null) {
    return "reserved";
  }
  return "free";
}

// Build the inside of one table card (picture on top, details below)
function tileHtml(picture, number, state, who, place, amount, seats) {
  let html = '<div class="table-picture">' + picture + '<span class="table-number">' + number + "</span>";
  if (seats != "") {
    html += '<span class="seat-badge">' + seats + " seats</span>";
  }
  html += '</div><div class="table-info"><span class="state">' + state + "</span>" +
    '<b class="who">' + who + "</b>";
  if (place != "") {
    html += '<small class="where">📍 ' + place + "</small>";
  }
  if (amount != "") {
    html += '<span class="bill-amount">' + amount + "</span>";
  }
  return html + "</div>";
}

// The buttons on top: each one shows how many tables are in that group
function drawFilters(counts) {
  let list = [["all", "All"], ["free", "Available"], ["pending", "Order pending"],
    ["placed", "Order placed"], ["bill", "Needs bill"], ["reserved", "Reserved"]];
  let bar = document.getElementById("filter-bar");
  bar.innerHTML = "";
  for (let item of list) {
    let button = document.createElement("button");
    button.className = "light-button f-" + item[0];
    if (item[0] == filter) {
      button.className = button.className + " active";   // the selected one is green
    }
    button.textContent = item[1] + " " + counts[item[0]];
    button.onclick = function () {
      filter = item[0];
      drawFloor();
    };
    bar.appendChild(button);
  }
}

// Draw all tables, takeaways and reservations
function drawFloor() {
  // step 1: count how many tables and takeaways are in each group
  let counts = { all: 0, free: 0, pending: 0, placed: 0, bill: 0, reserved: 0 };
  for (let table of data.tables) {
    let kind = kindOf(table.no);
    counts.all = counts.all + 1;
    counts[kind] = counts[kind] + 1;
  }
  for (let session of data.sessions) {
    if (session.table == "Takeaway" && session.status == "open") {
      let kind = sessionKind(session);
      counts.all = counts.all + 1;
      counts[kind] = counts[kind] + 1;
    }
  }
  drawFilters(counts);

  // step 2: draw only the tables that match the selected button
  let board = document.getElementById("table-board");
  board.innerHTML = "";
  for (let table of data.tables) {
    let kind = kindOf(table.no);
    if (filter != "all" && filter != kind) {
      continue;   // not in this group, skip it
    }
    let session = findOpen(table.no);
    let reservation = findReservation(table.no);
    let tile = document.createElement("button");
    let group = "taken";   // pending, placed and bill all use the red/orange look
    if (kind == "free") { group = "free"; }
    if (kind == "reserved") { group = "reserved"; }
    let state = words[kind];
    let who = "No customer";
    let amount = "";
    let place = table.location;
    if (place == undefined) { place = ""; }   // old saved data has no location yet

    if (session != null) {
      who = session.name;
      amount = money(dueOf(session));
    } else if (reservation != null) {
      state = "Reserved - " + new Date(reservation.when).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      who = reservation.name;
    }

    tile.className = "table-tile " + group + " " + kind;
    tile.innerHTML = tileHtml('<img src="' + tableImage(table) + '" onerror="this.onerror=null;this.src=\'' + defaultTableImage(table.seats) + '\'">',
      table.no, state, who, place, amount, table.seats);
    tile.onclick = function () { tapTable(table.no); };
    board.appendChild(tile);
  }
  if (board.innerHTML == "") {
    board.innerHTML = '<p class="muted">No tables in this group.</p>';
  }

  // takeaway orders that are still open (they follow the same buttons)
  let takeBoard = document.getElementById("takeaway-board");
  takeBoard.innerHTML = "";
  let takeCount = 0;
  for (let session of data.sessions) {
    if (session.table == "Takeaway" && session.status == "open") {
      let kind = sessionKind(session);
      if (filter != "all" && filter != kind) {
        continue;
      }
      takeCount = takeCount + 1;
      let tile = document.createElement("button");
      tile.className = "table-tile taken " + kind;
      tile.innerHTML = tileHtml('<span class="take-icon">🥡</span>', "T" + session.id,
        "Takeaway - " + words[kind].replace("Occupied - ", ""), session.name, "", money(dueOf(session)), "");
      tile.onclick = function () { goOrder(session.id); };
      takeBoard.appendChild(tile);
    }
  }
  document.getElementById("takeaway-area").hidden = (takeCount == 0);

  // reservation list (only when All or Reserved is selected)
  let rows = document.getElementById("reservation-rows");
  rows.innerHTML = "";
  for (let reservation of data.reservations) {
    rows.innerHTML += "<tr><td>" + reservation.table + "</td><td>" + reservation.name + "</td><td>" +
      reservation.guests + "</td><td>" + new Date(reservation.when).toLocaleString() + "</td><td>" +
      '<button class="small light-button" onclick="tapTable(\'' + reservation.table + '\')">Open</button></td></tr>';
  }
  let showReservations = (filter == "all" || filter == "reserved");
  document.getElementById("reservation-area").hidden = (data.reservations.length == 0 || showReservations == false);
}

// A new takeaway customer
function newTakeaway() {
  let session = makeSession("Takeaway", "Takeaway", 1);
  goOrder(session.id);
}

// The cashier tapped a table
function tapTable(no) {
  let session = findOpen(no);
  let reservation = findReservation(no);
  if (session != null) {
    goOrder(session.id);
  } else if (reservation != null) {
    openReserved(reservation);
  } else {
    openBox(no);
  }
}

// Pop-up for a free table
function openBox(no) {
  pickedTable = no;
  editingId = 0;
  document.getElementById("table-box").hidden = false;
  document.getElementById("box-free").hidden = false;
  document.getElementById("box-reserved").hidden = true;
  document.getElementById("box-title").textContent = "Table " + no;
  document.getElementById("box-info").textContent = findTable(no).seats + " seats";
  document.getElementById("box-name").value = "";
  document.getElementById("box-guests").value = "";
  document.getElementById("box-when").value = "";
  document.getElementById("when-preview").textContent = "";
  document.getElementById("box-error").textContent = "";
  showTab("seat");
}

// Pop-up for a reserved table
function openReserved(reservation) {
  reservedId = reservation.id;
  pickedTable = reservation.table;
  document.getElementById("table-box").hidden = false;
  document.getElementById("box-free").hidden = true;
  document.getElementById("box-reserved").hidden = false;
  document.getElementById("box-title").textContent = "Table " + reservation.table + " - Reserved";
  document.getElementById("box-info").textContent = reservation.name + ", " + reservation.guests +
    " guests, " + new Date(reservation.when).toLocaleString();
}

function findTable(no) {
  for (let table of data.tables) {
    if (table.no == no) {
      return table;
    }
  }
}

function closeBox() {
  document.getElementById("table-box").hidden = true;
}

// Switch between "Seat now" and "Reserve"
function showTab(newMode) {
  mode = newMode;
  document.getElementById("tab-seat").classList.toggle("active", mode == "seat");
  document.getElementById("tab-reserve").classList.toggle("active", mode == "reserve");
  // the date/time box is only needed when reserving
  document.getElementById("when-area").hidden = (mode == "seat");
  if (mode == "seat") {
    document.getElementById("box-save").textContent = "Seat customer";
  } else {
    document.getElementById("box-save").textContent = "Save reservation";
  }
}

// Show the chosen date in words under the box
function showWhen() {
  let when = document.getElementById("box-when").value;
  if (when == "") {
    document.getElementById("when-preview").textContent = "";
  } else {
    document.getElementById("when-preview").textContent = new Date(when).toLocaleString();
  }
}

// The quick buttons (In 1 hour, Tomorrow 6 PM ...)
function quickTime(kind) {
  let d = new Date();
  if (kind == "min30") { d.setMinutes(d.getMinutes() + 30); }
  if (kind == "hour1") { d.setHours(d.getHours() + 1); }
  if (kind == "hour2") { d.setHours(d.getHours() + 2); }
  if (kind == "today6") { d.setHours(18, 0, 0, 0); }
  if (kind == "tom12") { d.setDate(d.getDate() + 1); d.setHours(12, 0, 0, 0); }
  if (kind == "tom6") { d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0); }
  // the box wants it written like 2026-10-19T18:00
  document.getElementById("box-when").value = d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" +
    two(d.getDate()) + "T" + two(d.getHours()) + ":" + two(d.getMinutes());
  showWhen();
}

// Save button: seat the customer or save the reservation
function saveBox() {
  let name = document.getElementById("box-name").value;
  let guests = document.getElementById("box-guests").value;
  let when = document.getElementById("box-when").value;
  let error = document.getElementById("box-error");
  let seats = findTable(pickedTable).seats;

  if (guests == "") {
    error.textContent = "Please type how many guests.";
    return;
  }
  guests = Number(guests);
  if (guests < 1 || guests > seats) {
    error.textContent = "This table seats 1 to " + seats + " people.";
    return;
  }
  if (mode == "reserve" && when == "") {
    error.textContent = "Please pick the date and time.";
    return;
  }

  if (mode == "seat") {
    if (name == "") { name = "Walk-in"; }
    let session = makeSession(pickedTable, name, guests);
    goOrder(session.id);
    return;
  }

  // reserve
  if (name == "") { name = "Guest"; }
  if (editingId > 0) {
    // change the old reservation
    for (let reservation of data.reservations) {
      if (reservation.id == editingId) {
        reservation.name = name;
        reservation.guests = guests;
        reservation.when = when;
      }
    }
  } else {
    data.reservations.push({ id: Date.now(), table: pickedTable, name: name, guests: guests, when: when });
  }
  saveData();
  closeBox();
  drawFloor();
}

// Reserved customer arrived: remove the reservation and seat them
function seatReserved() {
  for (let reservation of data.reservations) {
    if (reservation.id == reservedId) {
      let session = makeSession(reservation.table, reservation.name, reservation.guests);
      data.reservations.splice(data.reservations.indexOf(reservation), 1);
      saveData();
      goOrder(session.id);
      return;
    }
  }
}

// Edit button on a reserved table
function editFromBox() {
  for (let reservation of data.reservations) {
    if (reservation.id == reservedId) {
      openBox(reservation.table);
      showTab("reserve");
      editingId = reservation.id;
      document.getElementById("box-title").textContent = "Edit reservation - Table " + reservation.table;
      document.getElementById("box-name").value = reservation.name;
      document.getElementById("box-guests").value = reservation.guests;
      document.getElementById("box-when").value = reservation.when;
      showWhen();
    }
  }
}

// Cancel the reservation
function cancelFromBox() {
  if (confirm("Cancel this reservation?") == false) {
    return;
  }
  for (let reservation of data.reservations) {
    if (reservation.id == reservedId) {
      data.reservations.splice(data.reservations.indexOf(reservation), 1);
      break;
    }
  }
  saveData();
  closeBox();
  drawFloor();
}