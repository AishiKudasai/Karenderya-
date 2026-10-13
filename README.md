# Karenderya POS
Open with VS Code Live Server (right-click `index.html` -> Open with Live Server).

Pages: each screen has its own .html (the layout) and .js (fills in the data).
floor, order, orders, bill, receipt (one receipt), receipts (history), menu, settings
- `style.css` - design, `database.json` - starting data, `images/` - food photos

Flow: Floor -> tap table -> seat customer (or reserve) -> order -> send order (table stays open) -> add more -> Done ordering -> Bill -> receipt -> Finish.
Reservations: tap a free table and type 2. A reserved table shows yellow "Reserved"; tap it when the customer arrives to seat them.
Data is saved in the browser (localStorage); Setup -> Reset all data starts again from database.json.
