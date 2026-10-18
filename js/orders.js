// ===== orders.js: all orders sent to the kitchen =====

// the steps an order goes through
var steps = ["pending", "preparing", "ready", "served"];

function startPage() {
  drawOrders();
}

function drawOrders() {
  let rows = document.getElementById("order-rows");
  rows.innerHTML = "";

  for (let session of data.sessions) {
    for (let order of session.orders) {
      // write the food as text: "2 Rice, 1 Turon"
      let words = "";
      let total = 0;
      for (let item of order.items) {
        words = words + item.qty + " " + item.name + ", ";
        total = total + item.price * item.qty;
      }

      // buttons only while the order is still being made
      let buttons = "";
      if (order.status == "pending" || order.status == "preparing" || order.status == "ready") {
        buttons = '<button class="small" onclick="nextStatus(' + order.no + ')">Next</button> ' +
          '<button class="small danger-button" onclick="cancelOrder(' + order.no + ')">Cancel</button>';
      }

      rows.innerHTML += "<tr><td>#" + order.no + "</td><td>" + session.table + "</td><td>" + words +
        "</td><td>" + money(total) + '</td><td><span class="status ' + order.status + '">' +
        order.status + "</span></td><td>" + buttons + "</td></tr>";
    }
  }
  if (rows.innerHTML == "") {
    rows.innerHTML = '<tr><td colspan="6">No orders yet.</td></tr>';
  }
}

// Find an order using its number
function findOrder(no) {
  for (let session of data.sessions) {
    for (let order of session.orders) {
      if (order.no == no) {
        return order;
      }
    }
  }
}

// Move to the next step: pending -> preparing -> ready -> served
function nextStatus(no) {
  let order = findOrder(no);
  let place = steps.indexOf(order.status);
  if (place < steps.length - 1) {
    order.status = steps[place + 1];
  }
  saveData();
  drawOrders();
}

function cancelOrder(no) {
  if (confirm("Cancel order #" + no + "?")) {
    findOrder(no).status = "canceled";
    saveData();
    drawOrders();
  }
}