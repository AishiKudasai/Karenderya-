// ===== bill.js: show the bill and take payment =====

var session = null;

function startPage() {
  session = currentSession();
  if (session == null) {
    showPage("floor");
    return;
  }
  drawBill();
  // start the "amount to collect" box with the full balance
  document.getElementById("collect").value = balanceOf(session).toFixed(2);
}

function drawBill() {
  document.getElementById("bill-title").textContent = "Bill - Table " + session.table;

  // discount message and button
  let status = document.getElementById("discount-status");
  let button = document.getElementById("discount-button");
  if (session.discount == true) {
    status.className = "tag-yes";
    status.textContent = "DISCOUNT APPLIED (" + data.shop.discount + "%)";
    button.textContent = "Remove discount";
  } else {
    status.className = "tag-none";
    status.textContent = "NO DISCOUNT";
    button.textContent = "Apply discount (" + data.shop.discount + "%)";
  }

  // one row for every food in every order
  let rows = document.getElementById("bill-rows");
  rows.innerHTML = "";
  for (let order of session.orders) {
    if (order.status == "canceled") { continue; }
    for (let item of order.items) {
      rows.innerHTML += "<tr><td>#" + order.no + "</td><td>" + item.name + "</td><td>" +
        item.qty + "</td><td>" + money(item.price * item.qty) + "</td></tr>";
    }
  }

  document.getElementById("bill-subtotal").textContent = money(subtotalOf(session));
  document.getElementById("bill-discount").textContent = "-" + money(discountOf(session));
  document.getElementById("bill-due").textContent = money(dueOf(session));
  document.getElementById("bill-paid").textContent = money(session.paid);
  document.getElementById("bill-balance").textContent = money(balanceOf(session));

  // fully paid: hide the payment box and show the finish button
  let paidFully = balanceOf(session) < 0.01;
  document.getElementById("payment-box").hidden = paidFully;
  document.getElementById("finish-box").hidden = (paidFully == false);
}

// Discount button: switch on / off
function toggleDiscount() {
  if (session.discount == true) {
    session.discount = false;
  } else {
    session.discount = true;
  }
  saveData();
  drawBill();
  document.getElementById("collect").value = balanceOf(session).toFixed(2);
  showChange();
}

// Show the change while the cashier types
function showChange() {
  let collect = document.getElementById("collect").value;
  let cash = document.getElementById("cash").value;
  let change = document.getElementById("change");
  if (cash == "" || collect == "") {
    change.textContent = "";
  } else if (Number(cash) < Number(collect)) {
    change.textContent = "Cash is not enough";
  } else {
    change.textContent = "Change: " + money(Number(cash) - Number(collect));
  }
}

// Record payment button
function payNow() {
  let collect = document.getElementById("collect").value;
  let cash = document.getElementById("cash").value;

  if (collect == "" || Number(collect) <= 0) {
    alert("Type the amount to collect.");
    return;
  }
  collect = Number(collect);
  if (collect > balanceOf(session) + 0.01) {
    alert("That is more than the balance.");
    return;
  }
  if (cash == "") {
    cash = collect;   // no cash typed means exact payment
  }
  cash = Number(cash);
  if (cash < collect) {
    alert("Cash is not enough.");
    return;
  }

  session.paid = session.paid + collect;
  data.receiptCount = data.receiptCount + 1;

  // make a receipt and keep it in the history
  let orderNumbers = [];
  for (let order of session.orders) {
    if (order.status != "canceled") { orderNumbers.push("#" + order.no); }
  }
  data.receipts.push({
    no: data.receiptCount,
    sessionId: session.id,
    orders: orderNumbers.join(", "),
    items: allItems(session),
    discountOn: session.discount,
    subtotal: subtotalOf(session),
    discount: discountOf(session),
    due: dueOf(session),
    paid: collect,
    cash: cash,
    change: cash - collect,
    totalPaid: session.paid,
    balance: balanceOf(session),
    date: new Date().toLocaleString()
  });
  saveData();

  localStorage.setItem("receiptNo", data.receiptCount);
  localStorage.setItem("from", "bill");
  showPage("receipt");
}