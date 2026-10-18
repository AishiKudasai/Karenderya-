// ===== receipt.js: show one receipt =====

var receipt = null;

function startPage() {
  let number = Number(localStorage.getItem("receiptNo"));
  let from = localStorage.getItem("from");

  // find the receipt we want to show
  for (let r of data.receipts) {
    if (r.no == number) {
      receipt = r;
    }
  }
  if (receipt == null) {
    showPage("receipts");
    return;
  }

  document.getElementById("receipt-title").textContent = "Receipt";
  document.getElementById("r-shop").textContent = data.shop.name;
  document.getElementById("r-address").textContent = data.shop.address;
  document.getElementById("r-phone").textContent = data.shop.phone;
  document.getElementById("r-heading").textContent = "OFFICIAL RECEIPT";
  document.getElementById("r-no").textContent = "R-" + pad(receipt.no);
  document.getElementById("r-orders").textContent = receipt.orders;
  document.getElementById("r-date").textContent = receipt.date;
  document.getElementById("r-cashier").textContent = data.shop.cashier;

  // food lines
  let items = document.getElementById("r-items");
  items.innerHTML = "";
  for (let item of receipt.items) {
    items.innerHTML += "<tr><td>" + item.qty + " x " + item.name + "</td><td>" +
      money(item.price * item.qty) + "</td></tr>";
  }

  if (receipt.discountOn == true) {
    document.getElementById("r-discount-status").textContent = "DISCOUNT APPLIED (" + data.shop.discount + "%)";
  } else {
    document.getElementById("r-discount-status").textContent = "NO DISCOUNT";
  }

  document.getElementById("r-subtotal").textContent = money(receipt.subtotal);
  document.getElementById("r-discount").textContent = "-" + money(receipt.discount);
  document.getElementById("r-due").textContent = money(receipt.due);
  document.getElementById("r-paid").textContent = money(receipt.paid);
  document.getElementById("r-cash").textContent = money(receipt.cash);
  document.getElementById("r-change").textContent = money(receipt.change);
  document.getElementById("r-total-paid").textContent = money(receipt.totalPaid);
  document.getElementById("r-balance").textContent = money(receipt.balance);
  document.getElementById("r-footer").textContent = data.shop.footer;

  // which buttons to show at the bottom
  if (from == "history") {
    document.getElementById("back-history").hidden = false;
  } else if (receipt.balance < 0.01) {
    document.getElementById("finish-button").hidden = false;   // fully paid
  } else {
    document.getElementById("back-table").hidden = false;      // still has a balance
  }
}

// Download button: save the receipt text as a file
function downloadReceipt() {
  let text = document.getElementById("receipt-paper").innerText;
  let file = new Blob([text], { type: "text/plain" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "receipt-" + pad(receipt.no) + ".txt";
  link.click();
}