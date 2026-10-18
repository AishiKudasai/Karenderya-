// ===== menu.js: add, edit, hide and delete food =====

function startPage() {
  drawMenu();
}

function drawMenu() {
  let rows = document.getElementById("menu-rows");
  rows.innerHTML = "";
  for (let number = 0; number < data.menu.length; number++) {
    let food = data.menu[number];
    let row = "<tr>";
    let status = '<span class="status served">Available</span>';
    let toggle = "Sold out";
    if (food.available == false) {
      row = '<tr class="sold-out">';   // gray with a line through it
      status = '<span class="status canceled">Sold out</span>';
      toggle = "Available";
    }
    rows.innerHTML += row + "<td>" + (number + 1) + "</td><td>" + food.name + "</td><td>" + food.category + "</td><td>" +
      money(food.price) + "</td><td>" + food.image + "</td><td>" + status + "</td><td>" +
      '<button class="small light-button" onclick="editItem(' + number + ')">Edit</button> ' +
      '<button class="small light-button" onclick="toggleItem(' + number + ')">Mark ' + toggle + "</button> " +
      '<button class="small danger-button" onclick="deleteItem(' + number + ')">Delete</button></td></tr>';
  }
}

// + Add food button
function newMenuItem() {
  let name = prompt("Food name:");
  if (name == null || name == "") { return; }       // cancel or empty: stop
  let category = prompt("Category (Ulam, Drinks, Snacks...):", "Ulam");
  if (category == null || category == "") { return; }
  let price = Number(prompt("Price:"));
  if (price > 0) {
    let image = prompt("Image file (example: images/adobo.jpg):", "images/");
    data.menu.push({ name: name, category: category, price: price, image: image, available: true });
    saveData();
    drawMenu();
  } else {
    alert("Price must be a number above 0.");   // letters or 0 end up here
  }
}

// Edit button: ask for each new value, leave blank to keep the old one
function editItem(number) {
  let food = data.menu[number];
  let name = prompt("Food name:", food.name);
  if (name != null && name != "") { food.name = name; }
  let category = prompt("Category:", food.category);
  if (category != null && category != "") { food.category = category; }
  let price = prompt("Price:", food.price);
  if (price != null && Number(price) > 0) { food.price = Number(price); }
  let image = prompt("Image file:", food.image);
  if (image != null) { food.image = image; }
  saveData();
  drawMenu();
}

// Sold out <-> Available
function toggleItem(number) {
  if (data.menu[number].available == true) {
    data.menu[number].available = false;
  } else {
    data.menu[number].available = true;
  }
  saveData();
  drawMenu();
}

function deleteItem(number) {
  if (confirm("Delete " + data.menu[number].name + "?")) {
    data.menu.splice(number, 1);
    saveData();
    drawMenu();
  }
}