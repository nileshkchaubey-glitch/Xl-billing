// IndexedDB holds full records and photos without localStorage's small quota.
export class BrowserCache {
  async open() {
    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('xl-billing', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('workspace');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('The browser could not open billing storage. Export existing data before continuing.'));
    });
  }
  async read() {
    return new Promise((resolve, reject) => {
      const request = this.db.transaction('workspace').objectStore('workspace').get('current');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  async write(value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('workspace', 'readwrite');
      transaction.objectStore('workspace').put(value, 'current');
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(new Error('The browser could not save the billing cache. Free storage space and retry.'));
      transaction.onerror = () => {}; // onabort reports the failed atomic write.
    });
  }
}
