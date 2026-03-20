const crypto = require('crypto');

const docxStore = new Map();

function storeDocxBuffer(buffer) {
  const id = crypto.randomBytes(16).toString('hex');
  docxStore.set(id, buffer);
  // Auto-cleanup after 30 minutes
  setTimeout(() => docxStore.delete(id), 30 * 60 * 1000);
  return id;
}

function getDocxBuffer(id) {
  return docxStore.get(id) || null;
}

module.exports = {
  storeDocxBuffer,
  getDocxBuffer,
};
