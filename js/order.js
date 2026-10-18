// ===== order.js: pick food for one table =====

var session = null;      // the customer we are ordering for
var category = "All";    // the category button that is selected
var search = "";         // what the cashier typed in the search box

function startPage() {
  session = currentSession();
  if (session == null) {
    showPage("floor");
    return;
  }
  drawCategories();
  drawFood();
  drawTicket();
}

// Category buttons on the left: All + every category in the menu
function drawCategories() {
  let names = ["All"];
  for (let food of data.menu) {
    if (names.indexOf(food.category) == -1) {
      names.push(food.category);
    }
  }
  let box = document.getElementById("category-list");
  box.innerHTML = "";
  for (let name of names) {
    let button = document.createElement("button");
    button.textContent = name;
    if (name == category) { button.className = "active"; }
    button.onclick = function () {
      category = name;
      drawCategories();
      drawFood();
    };
    box.appendChild(button);
  }
}

// Food cards in the middle
function drawFood() {
  let grid = document.getElementById("food-grid");
  grid.innerHTML = "";
  for (let food of data.menu) {
    // skip food that is in another category or does not match the search
    if (category != "All" && food.category != category) { continue; }
    if (search != "" && food.name.toLowerCase().indexOf(search) == -1) { continue; }

    let card = document.createElement("button");
    card.className = "food-card";
    if (food.available == false) { card.className = "food-card unavailable"; }
    // the first letter shows if the picture is missing
    card.innerHTML = '<div class="food-picture">' + food.name.charAt(0) +
      '<img src="' + food.image + '" onerror="this.remove()"></div>' +
      "<strong>" + food.name + '</strong><span class="price">' + money(food.price) + "</span>";
    card.onclick = function () { addFood(food); };
    grid.appendChild(card);
  }
}

// Typing in the search box
function onSearch() {
  search = document.getElementById("search-box").value.toLowerCase();
  drawFood();
}

// Add one food to the new (not sent) order
function addFood(food) {
  if (food.available == false) {
    alert(food.name + " is sold out.");
    return;
  }
  for (let item of session.draft) {
    if (item.name == food.name) {
      item.qty = item.qty + 1;
      saveData();
      drawTicket();
      return;
    }
  }
  session.draft.push({ name: food.name, price: food.price, qty: 1 });
  saveData();
  drawTicket();
}

// The + and - buttons in the new order list
function changeQty(number, change) {
  session.draft[number].qty = session.draft[number].qty + change;
  if (session.draft[number].qty <= 0) {
    session.draft.splice(number, 1);   // remove the item
  }
  saveData();
  drawTicket();
}

// Total price of the new order
function draftTotal() {
  let total = 0;
  for (let item of session.draft) {
    total = total + item.price * item.qty;
  }
  return total;
}

// The ticket on the right
function drawTicket() {
  document.getElementById("ticket-title").textContent = "Table " + session.table + " - " + session.name;
  document.getElementById("ticket-total").textContent = "Total " + money(subtotalOf(session) + draftTotal());

  let sent = document.getElementById("sent-list");
  sent.innerHTML = "";
  for (let order of session.orders) {
    for (let item of order.items) {
      sent.innerHTML += "<li>" + item.qty + " x " + item.name + '<span class="price">' +
        money(item.price * item.qty) + "</span></li>";
    }
  }

  let list = document.getElementById("new-list");
  list.innerHTML = "";
  for (let number = 0; number < session.draft.length; number++) {
    let item = session.draft[number];
    list.innerHTML += "<li>" + item.qty + " x " + item.name + '<span class="price">' +
      money(item.price * item.qty) + "</span><br>" +
      '<button class="small light-button" onclick="changeQty(' + number + ', -1)">-</button> ' +
      '<button class="small light-button" onclick="changeQty(' + number + ', 1)">+</button></li>';
  }
  document.getElementById("new-total").textContent = money(draftTotal());
}

// Send the new items to the kitchen as one order
function sendOrder() {
  if (session.draft.length == 0) {
    alert("The new order is empty.");
    return;
  }
  data.orderCount = data.orderCount + 1;
  session.orders.push({
    no: data.orderCount,
    items: session.draft,
    status: "pending",
    time: new Date().toLocaleString()
  });
  session.draft = [];
  saveData();
  showPage("floor");   // order is sent, go back to the tables
}

// Throw away the new items
function clearDraft() {
  session.draft = [];
  saveData();
  drawTicket();
}

// Go to the bill (only when nothing is waiting to be sent)
function goBill() {
  if (session.draft.length > 0) {
    alert("Send the new order first, or clear it.");
    return;
  }
  if (session.orders.length == 0) {
    alert("There is no order yet.");
    return;
  }
  showPage("bill");
}