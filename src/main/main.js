const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const XMPPManager = require('./xmppManager');
const { loadAccounts } = require('./accountStore');

const xmppManager = new XMPPManager();

// Track the current renderer's webContents for sending stanza responses
let mainWindow = null;

// Forward stanza responses and status to renderer
ipcMain.on('subscribe-stanza', (event, accountId) => {
  // Always update the sender reference (handles hot reload)
  if (!global.stanzaSenders) global.stanzaSenders = {};
  global.stanzaSenders[accountId] = event.sender;

  // Only set up the callback once per account
  if (!global.stanzaSubscribed) global.stanzaSubscribed = {};
  if (global.stanzaSubscribed[accountId]) return;
  global.stanzaSubscribed[accountId] = true;

  xmppManager.onMessage(accountId, stanza => {
    const sender = global.stanzaSenders[accountId];
    if (sender && !sender.isDestroyed()) {
      sender.send('stanza-response', accountId, stanza.toString());
    }
  });

  xmppManager.onStatus(accountId, status => {
    const sender = global.stanzaSenders[accountId];
    if (sender && !sender.isDestroyed()) {
      sender.send('account-status', accountId, status);
    }
  });
});

ipcMain.handle('get-accounts', () => {
  // Return all loaded accounts (without xmpp client objects)
  return loadAccounts();
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173'); // Vite dev server default port
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

// IPC handlers for account management and messaging
ipcMain.handle('add-account', (event, accountId, accountData) => {
  console.log(`[IPC] add-account handler called with accountId: ${accountId}`, accountData);
  try {
    xmppManager.addAccount(accountId, accountData);
    console.log(`[IPC] Account added successfully`);
    return { success: true };
  } catch (err) {
    console.error(`[IPC] Error adding account:`, err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('connect-account', (event, accountId) => {
  console.log(`[IPC] connect-account handler called with accountId: ${accountId}`);
  try {
    xmppManager.connect(accountId);
    console.log(`[IPC] Connect request processed`);
    return { success: true };
  } catch (err) {
    console.error(`[IPC] Error connecting account:`, err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('send-stanza', (event, accountId, xmlString) => {
  try {
    xmppManager.sendStanza(accountId, xmlString);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('disconnect-account', (event, accountId) => {
  try {
    xmppManager.disconnect(accountId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('remove-account', (event, accountId) => {
  try {
    xmppManager.removeAccount(accountId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  // Load saved accounts and add to manager
  const savedAccounts = loadAccounts();
  for (const [id, data] of Object.entries(savedAccounts)) {
    try {
      xmppManager.addAccount(id, data);
      console.log(`[Main] Loaded account: ${id}`);
    } catch (err) {
      console.error(`[Main] Failed to load account ${id}:`, err.message);
    }
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('[Main] Electron app started');
