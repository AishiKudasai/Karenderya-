// ===== settings.js: shop info, discount rate and tables =====

function startPage() {
  drawSettings();
}

function drawSettings() {
  document.getElementById("set-name").textContent = data.shop.name;
  document.getElementById("set-address").textContent = data.shop.address;
  document.getElementById("set-phone").textContent = data.shop.phone;
  document.getElementById("set-cashier").textContent = data.shop.cashier;
  document.getElementById("set-footer").textContent = data.shop.footer;
  document.getElementById("set-discount").textContent = data.shop.discount + "%";

  let rows = document.getElementById("table-rows");
  rows.innerHTML = "";
  for (let number = 0; number < data.tables.length; number++) {
    let table = data.tables[number];
    let place = table.location;
    if (place == undefined) { place = "-"; }   // old saved data has no location yet
    rows.innerHTML += "<tr><td>Table " + table.no + "</td><td>" + table.seats + " seats</td><td>" + place + "</td><td>" +
      '<button class="small light-button" onclick="editSeats(' + number + ')">Seats</button> ' +
      '<button class="small light-button" onclick="editLocation(' + number + ')">Place</button> ' +
      '<button class="small light-button" onclick="editImage(' + number + ')">Image</button> ' +
      '<button class="small danger-button" onclick="removeTable(' + number + ')">Remove</button></td></tr>';
  }
}

// Edit button for name, address, phone, cashier, footer
function editShop(field) {
  let answer = prompt("New value:", data.shop[field]);
  if (answer != null && answer != "") {   // cancel or empty: keep the old one
    data.shop[field] = answer;
    saveData();
    drawSettings();
  }
}

function editDiscount() {
  let answer = Number(prompt("Discount rate (0 to 100):", data.shop.discount));
  if (answer >= 0 && answer <= 100) {
    data.shop.discount = answer;
    saveData();
    drawSettings();
  } else {
    alert("Type a number from 0 to 100.");
  }
}

function addTable() {
  let seats = Number(prompt("How many seats?", 4));
  if (seats < 1 || seats > 20 || seats == 0) {
    alert("Type a number from 1 to 20.");
    return;
  }
  // new table number = the biggest number now + 1
  let biggest = 0;
  for (let table of data.tables) {
    if (Number(table.no) > biggest) { biggest = Number(table.no); }
  }
  let place = prompt("Where is it? (example: Near counter)", "");
  if (place == null) { place = ""; }
  data.tables.push({ no: "" + (biggest + 1), seats: seats, location: place });
  saveData();
  drawSettings();
}

function editSeats(number) {
  let seats = Number(prompt("How many seats?", data.tables[number].seats));
  if (seats >= 1 && seats <= 20) {
    data.tables[number].seats = seats;
    saveData();
    drawSettings();
  } else {
    alert("Type a number from 1 to 20.");
  }
}

// Place button: where the table is (near counter, by the window...)
function editLocation(number) {
  let old = data.tables[number].location;
  if (old == undefined) { old = ""; }
  let place = prompt("Where is this table?", old);
  if (place != null) {
    data.tables[number].location = place;
    saveData();
    drawSettings();
  }
}

// Image button: the picture of this table (leave empty to use the default picture)
function editImage(number) {
  let old = data.tables[number].image;
  if (old == undefined) { old = ""; }
  let picture = prompt("Picture file for this table (example: images/table-1.jpg). Leave empty for the default picture:", old);
  if (picture != null) {
    data.tables[number].image = picture;
    saveData();
    drawSettings();
  }
}

function removeTable(number) {
  let table = data.tables[number];
  // do not remove a table that has a customer
  for (let session of data.sessions) {
    if (session.table == table.no && session.status == "open") {
      alert("Table " + table.no + " has a customer right now.");
      return;
    }
  }
  if (confirm("Remove table " + table.no + "?")) {
    data.tables.splice(number, 1);
    saveData();
    drawSettings();
  }
}