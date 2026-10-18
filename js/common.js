// ===== common.js: code that every page uses =====

// all the restaurant data (tables, menu, sessions, receipts...) lives in this one box
let data = {};

// Get the data. If we saved it before, use that. If not, read database.json
function loadData() {
  let saved = localStorage.getItem("karenderya");
  if (saved != null) {
    data = JSON.parse(saved);
    ready();
  } else {
    // fetch reads a file from the folder; "then" means "when it is done, do this"
    fetch("database.json")
      .then(function (answer) { return answer.json(); })
      .then(function (file) {
        data = file;
        saveData();
        ready();
      });
  }
}

// Fill the top bar, then start the page's own code (startPage is inside each page's js file)
function ready() {
  document.getElementById("shop-name").textContent = data.shop.name;
  document.getElementById("cashier-name").textContent = data.shop.cashier;
  let now = new Date();
  document.getElementById("date-time").textContent =
    now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " · " +
    now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  // the circle shows the first letter of the cashier's name
  document.getElementById("avatar").textContent = data.shop.cashier.charAt(0);
  startPage();
}

// Save everything in the browser
function saveData() {
  localStorage.setItem("karenderya", JSON.stringify(data));
}

// Go to another page. "floor" is index.html, the others are name + .html
function showPage(name) {
  if (name == "floor") {
    window.location = "index.html";
  } else {
    window.location = name + ".html";
  }
}

// Show a number as pesos with 2 decimals, like ₱65.00
function money(number) {
  return "₱" + number.toFixed(2);
}

// Put zeros in front: 7 becomes "0007" (used for receipt numbers)
function pad(number) {
  let text = "" + number;
  while (text.length < 4) {
    text = "0" + text;
  }
  return text;
}

// Put one zero in front when below 10: 5 becomes "05" (used for dates)
function two(number) {
  if (number < 10) {
    return "0" + number;
  }
  return "" + number;
}

// Find the table or takeaway the cashier is working on right now
function currentSession() {
  let id = Number(localStorage.getItem("currentId"));
  for (let session of data.sessions) {
    if (session.id == id) {
      return session;
    }
  }
  return null;
}

// Collect every food line that was sent (skip canceled orders)
function allItems(session) {
  let list = [];
  for (let order of session.orders) {
    if (order.status != "canceled") {
      for (let item of order.items) {
        list.push(item);
      }
    }
  }
  return list;
}

// Price of all food, before discount
function subtotalOf(session) {
  let total = 0;
  for (let item of allItems(session)) {
    total = total + item.price * item.qty;
  }
  return total;
}

// Discount is only taken off when the Discount button was pressed
function discountOf(session) {
  if (session.discount == true) {
    return subtotalOf(session) * data.shop.discount / 100;
  }
  return 0;
}

// What the customer must pay
function dueOf(session) {
  return subtotalOf(session) - discountOf(session);
}

// What is still unpaid (below 0.01 means fully paid)
function balanceOf(session) {
  return dueOf(session) - session.paid;
}

// Close the table: orders become completed and the table is free again
function finishCheckout() {
  let session = currentSession();
  session.status = "closed";
  for (let order of session.orders) {
    if (order.status != "canceled") {
      order.status = "completed";
    }
  }
  saveData();
  localStorage.removeItem("currentId");
  showPage("floor");
}