// RECEIPT HISTORY PAGE
function drawPage() {
  var rows = '';
  for (var i = data.receipts.length - 1; i >= 0; i--) {
    var r = data.receipts[i];
    var nos = '';
    for (var j = 0; j < r.orderNos.length; j++) { nos += '#' + pad(r.orderNos[j]) + ' '; }
    var tag = '';
    if (r.partial) { tag = ' <span class="status">partial</span>'; }
    var disc = 'No';
    if (r.percent != undefined && r.percent > 0) { disc = 'Yes (' + r.percent + '%)'; }
    rows += '<tr><td>' + r.no + tag + '</td><td>' + nos + '</td><td>' + money(r.collected) + '</td><td>' + disc + '</td><td>' + r.date +
            '</td><td><button class="small light-button" onclick="viewReceipt(' + i + ')">View / Print</button></td></tr>';
  }
  if (rows == '') { rows = '<tr><td colspan="6">No receipts yet.</td></tr>'; }
  document.getElementById('receipt-rows').innerHTML = rows;
}

function viewReceipt(i) { setLastReceipt(i, 'history'); showPage('receipt'); }