import { Utils } from './utils.js';

export const StorageManager = {
  async initStorage() {
    if (!localStorage.getItem('karenderya_settings')) {
      try {
        const res = await fetch('data/initial-data.json');
        const initial = await res.json();
        localStorage.setItem('karenderya_settings', JSON.stringify(initial.settings));
        localStorage.setItem('karenderya_tables', JSON.stringify(initial.tables));
        localStorage.setItem('karenderya_customers', JSON.stringify(initial.customers));
        localStorage.setItem('karenderya_reservations', JSON.stringify(initial.reservations));
        localStorage.setItem('karenderya_sessions', JSON.stringify(initial.sessions));
        localStorage.setItem('karenderya_orders', JSON.stringify(initial.orders));
        localStorage.setItem('karenderya_bills', JSON.stringify(initial.bills));
        localStorage.setItem('karenderya_payments', JSON.stringify(initial.payments));
        localStorage.setItem('karenderya_receipts', JSON.stringify(initial.receipts));
        localStorage.setItem('karenderya_deliveryAttempts', JSON.stringify(initial.deliveryAttempts));
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }

    if (!localStorage.getItem('karenderya_menu')) {
      try {
        const res = await fetch('data/menu.json');
        const menu = await res.json();
        localStorage.setItem('karenderya_menu', JSON.stringify(menu));
      } catch (err) {
        console.error('Failed to load menu data:', err);
      }
    }
  },

  load(key) {
    const data = localStorage.getItem('karenderya_' + key);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error parsing storage key:', key, e);
      return null;
    }
  },

  save(key, data) {
    localStorage.setItem('karenderya_' + key, JSON.stringify(data));
  },

  resetDemoData() {
    localStorage.clear();
    location.reload();
  }
};