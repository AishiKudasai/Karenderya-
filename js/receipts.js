// ===== receipts.js: list of all receipts =====

function startPage() {
  let rows = document.getElementById("receipt-rows");
  rows.innerHTML = "";
  // go from the last receipt to the first so the newest is on top
  for (let n = data.receipts.length - 1; n >= 0; n--) {
    let r = data.receipts[n];
    rows.innerHTML += "<tr><td>R-" + pad(r.no) + "</td><td>" + r.orders + "</td><td>" +
      money(r.paid) + "</td><td>" + money(r.discount) + "</td><td>" + r.date + "</td><td>" +
      '<button class="small light-button" onclick="openReceipt(' + r.no + ')">View</button></td></tr>';
  }
  if (data.receipts.length == 0) {
    rows.innerHTML = '<tr><td colspan="6">No receipts yet.</td></tr>';
  }
}

// View button: remember which receipt, then open it
function openReceipt(no) {
  localStorage.setItem("receiptNo", no);
  localStorage.setItem("from", "history");
  showPage("receipt");
}