import { StorageManager } from './storage.js';

export const State = {
  get settings() { return StorageManager.load('settings') || {}; },
  get tables() { return StorageManager.load('tables') || []; },
  get customers() { return StorageManager.load('customers') || []; },
  get reservations() { return StorageManager.load('reservations') || []; },
  get sessions() { return StorageManager.load('sessions') || []; },
  get orders() { return StorageManager.load('orders') || []; },
  get menu() { return StorageManager.load('menu') || []; },
  get bills() { return StorageManager.load('bills') || []; },
  get payments() { return StorageManager.load('payments') || []; },
  get receipts() { return StorageManager.load('receipts') || []; },
  get deliveryAttempts() { return StorageManager.load('deliveryAttempts') || []; },

  saveTables(data) { StorageManager.save('tables', data); },
  saveCustomers(data) { StorageManager.save('customers', data); },
  saveReservations(data) { StorageManager.save('reservations', data); },
  saveSessions(data) { StorageManager.save('sessions', data); },
  saveOrders(data) { StorageManager.save('orders', data); },
  saveMenu(data) { StorageManager.save('menu', data); },
  saveBills(data) { StorageManager.save('bills', data); },
  savePayments(data) { StorageManager.save('payments', data); },
  saveReceipts(data) { StorageManager.save('receipts', data); },
  saveDeliveryAttempts(data) { StorageManager.save('deliveryAttempts', data); },
  saveSettings(data) { StorageManager.save('settings', data); }
};