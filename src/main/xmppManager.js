// Account and XMPP connection manager for Virtuoso
const { client, xml } = require('@xmpp/client');
const { loadAccounts, saveAccounts } = require('./accountStore');
const ltx = require('ltx');

class XMPPManager {
  constructor() {
    this.accounts = {};
    this.accountData = loadAccounts();
  }

  addAccount(accountId, { jid, password, host, port }) {
    this.accountData[accountId] = { jid, password, host, port };
    saveAccounts(this.accountData);
    console.log(`[XMPP] addAccount called: accountId=${accountId}, jid=${jid}, host=${host}, port=${port}`);
    if (this.accounts[accountId]) {
      throw new Error('Account already exists');
    }
    const username = jid.includes('@') ? jid.split('@')[0] : jid;
    console.log(`[XMPP] Extracted username: ${username}`);
    const xmpp = client({
      service: `xmpp://${host}:${port}`,
      domain: host,
      resource: 'virtuoso',
      username,
      password
    });
    console.log(`[XMPP] XMPP client created for ${accountId}`);
    xmpp.on('error', err => {
      console.error(`[XMPP][${accountId}] Connection error:`, err);
      if (this.accounts[accountId].onStatus) {
        this.accounts[accountId].onStatus('error');
      }
    });
    xmpp.on('status', status => {
      console.log(`[XMPP][${accountId}] Status:`, status);
      if (this.accounts[accountId].onStatus) {
        this.accounts[accountId].onStatus(status);
      }
    });
    xmpp.on('online', address => {
      console.log(`[XMPP][${accountId}] Connected as:`, address.toString());
      if (this.accounts[accountId].onStatus) {
        this.accounts[accountId].onStatus('connected');
      }
    });
    xmpp.on('offline', () => {
      console.log(`[XMPP][${accountId}] Disconnected.`);
      if (this.accounts[accountId].onStatus) {
        this.accounts[accountId].onStatus('disconnected');
      }
    });
    // Attach stanza listener once per account
    this.accounts[accountId] = { xmpp, jid, password, host, port, onStanza: null };
    xmpp.on('stanza', stanza => {
      const acc = this.accounts[accountId];
      if (acc && acc.onStanza) {
        acc.onStanza(stanza);
      }
    });
    console.log(`[XMPP] Account ${accountId} added to manager`);
    return xmpp;
  }

  connect(accountId) {
    console.log(`[XMPP] connect() called for ${accountId}`);
    const account = this.accounts[accountId];
    if (!account) {
      console.error(`[XMPP] Account ${accountId} not found`);
      throw new Error('Account not found');
    }
    // Prevent repeated connect attempts
    const status = account.xmpp.status;
    if (status === 'connecting' || status === 'connected' || status === 'online' || status === 'open') {
      console.warn(`[XMPP] Account ${accountId} is already connecting or connected.`);
      return;
    }
    console.log(`[XMPP] Starting connection for ${accountId}...`);
    account.xmpp.start().catch(console.error);
    console.log(`[XMPP] start() called for ${accountId}`);
  }

  sendStanza(accountId, xmlString) {
    const account = this.accounts[accountId];
    if (!account) throw new Error('Account not found');
    // Only send if client is online/connected
    const status = account.xmpp.status;
    if (!(status === 'online' || status === 'open' || status === 'connected')) {
      throw new Error('Account is not connected');
    }
    let stanza;
    try {
      // Parse raw XML string using ltx
      stanza = ltx.parse(xmlString.trim()); // Ensure no stray characters
      console.log(`[XMPP] Sending stanza:`, stanza.toString());
    } catch (err) {
      console.error(`[XMPP] XML parse error:`, err.message);
      throw new Error('Invalid XML stanza: ' + err.message);
    }
    account.xmpp.send(stanza);
  }

  onMessage(accountId, callback) {
    const account = this.accounts[accountId];
    if (!account) throw new Error('Account not found');
    // Just set the callback - listener is already attached from addAccount
    account.onStanza = callback;
  }

  onStatus(accountId, callback) {
    const account = this.accounts[accountId];
    if (!account) throw new Error('Account not found');
    account.onStatus = callback;
  }

  disconnect(accountId) {
    const account = this.accounts[accountId];
    if (!account) throw new Error('Account not found');
    account.xmpp.stop().catch(console.error);
  }

  removeAccount(accountId) {
    this.disconnect(accountId);
    delete this.accounts[accountId];
  }

  removeMessageListener(accountId, listener) {
    const account = this.accounts[accountId];
    if (!account) throw new Error('Account not found');
    account.xmpp.removeListener('stanza', listener);
  }
}

module.exports = XMPPManager;
