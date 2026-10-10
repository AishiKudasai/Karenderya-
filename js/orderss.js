// ORDERS PAGE - rows are filled into the table in orders.html
function drawPage() {
  var rows = '';
  for (var i = data.sessions.length - 1; i >= 0; i--) {
    var s = data.sessions[i];
    for (var j = 0; j < s.orders.length; j++) {
      var o = s.orders[j];
      var names = '';
      for (var k = 0; k < o.items.length; k++) {
        names += o.items[k].qty + '× ' + safe(o.items[k].name);
        if (o.items[k].note != '') { names += ' (' + safe(o.items[k].note) + ')'; }
        names += '<br>';
      }
      var buttons = '';
      if (o.status == 'Pending' || o.status == 'Preparing' || o.status == 'Ready') {
        buttons = '<button class="small" onclick="nextStatus(' + i + ',' + j + ')">Next step</button> ';
      }
      if (o.status == 'Served') { buttons = '<button class="small" onclick="nextStatus(' + i + ',' + j + ')">Mark done</button> '; }
      if (s.closed == false && o.status != 'Canceled' && o.status != 'Completed') {
        buttons += '<button class="small light-button" onclick="cancelOrder(' + i + ',' + j + ')">Cancel</button>';
      }
      var reason = '';
      if (o.reason != '') { reason = '<br><small>' + safe(o.reason) + '</small>'; }
      rows += '<tr><td>' + pad(o.no) + '</td><td>' + tableLabel(s) + '<br><small>' + safe(s.name) + '</small></td><td>' + names + '</td><td>' + money(orderTotal(o)) +
              '</td><td><span class="status ' + o.status.toLowerCase() + '">' + o.status + '</span>' + reason + '</td><td>' + buttons + '</td></tr>';
    }
  }
  if (rows == '') { rows = '<tr><td colspan="6">No orders yet.</td></tr>'; }
  document.getElementById('order-rows').innerHTML = rows;
}

function nextStatus(i, j) {
  var o = data.sessions[i].orders[j];
  if (o.status == 'Pending') { o.status = 'Preparing'; }
  else if (o.status == 'Preparing') { o.status = 'Ready'; }
  else if (o.status == 'Ready') { o.status = 'Served'; }
  else if (o.status == 'Served') { o.status = 'Completed'; }
  saveData(); drawPage();
}

function cancelOrder(i, j) {
  var reason = prompt('Why is this order cancelled?');
  if (reason == null || reason == '') { alert('A reason is required.'); return; }
  var s = data.sessions[i];
  var newSubtotal = subtotal(s) - orderTotal(s.orders[j]);
  var newDue = round2(newSubtotal - newSubtotal * s.discount / 100);
  if (paidSoFar(s) > newDue) { alert('Cannot cancel: the customer already paid more than the new bill would be.'); return; }
  s.orders[j].status = 'Canceled';
  s.orders[j].reason = reason;
  saveData(); drawPage();
}
