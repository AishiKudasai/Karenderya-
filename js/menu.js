// MENU PAGE
function drawPage() {
  var rows = '';
  for (var i = 0; i < data.menu.length; i++) {
    var m = data.menu[i];
    var status = 'Available';
    var cls = 'small';
    if (m.available == false) { status = 'Unavailable'; cls = 'small light-button'; }
    rows += '<tr><td>' + safe(m.name) + '</td><td>' + safe(m.category) + '</td><td>' + money(m.price) + '</td><td><small>' + safe(m.image) + '</small></td>' +
            '<td><button class="' + cls + '" onclick="toggleFood(' + i + ')">' + status + '</button></td>' +
            '<td><button class="small light-button" onclick="editFood(' + i + ')">Edit</button></td></tr>';
  }
  document.getElementById('menu-rows').innerHTML = rows;
}

function toggleFood(i) { data.menu[i].available = !data.menu[i].available; saveData(); drawPage(); }

function newMenuItem() {
  var name = prompt('Food name:');
  if (name == null || name == '') { return; }
  var cat = prompt('Category (Rice Meals, Ulam, Silog Meals, Vegetables, Snacks, Drinks, Extras):', 'Ulam');
  var price = parseFloat(prompt('Price in pesos:'));
  if (isNaN(price) || price < 0) { alert('Invalid price.'); return; }
  var image = prompt('Image file path (example: images/adobo.jpg). Leave blank for none:', '');
  if (image == null) { image = ''; }
  data.menu.push({name: name, category: cat, price: price, image: image, available: true});
  saveData(); drawPage();
}

function editFood(i) {
  var m = data.menu[i];
  var name = prompt('Food name:', m.name);
  if (name == null || name == '') { return; }
  var price = parseFloat(prompt('Price in pesos:', m.price));
  if (isNaN(price) || price < 0) { alert('Invalid price.'); return; }
  var image = prompt('Image file path (example: images/adobo.jpg):', m.image);
  if (image == null) { image = m.image; }
  m.name = name; m.price = price; m.image = image;   // old orders keep their own saved name and price
  saveData(); drawPage();
}
