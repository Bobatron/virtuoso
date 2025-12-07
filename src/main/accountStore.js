const fs = require('fs');
const path = require('path');

const ACCOUNTS_FILE = path.join(__dirname, '../../accounts.json');

function loadAccounts() {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[AccountStore] Failed to load accounts:', err);
  }
  return {};
}

function saveAccounts(accounts) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AccountStore] Failed to save accounts:', err);
  }
}

module.exports = { loadAccounts, saveAccounts };
