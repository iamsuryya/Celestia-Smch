/**
 * Image compression and IndexedDB storage utility for Celestia Fest.
 * Prevents QuotaExceededError in localStorage by compressing images
 * to optimal responsive dimensions and persisting in IndexedDB.
 */

const DB_NAME = 'celestia_storage_db';
const DB_VERSION = 1;
const GUEST_IMAGES_STORE = 'guest_images';

// Open or initialize IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(GUEST_IMAGES_STORE)) {
        db.createObjectStore(GUEST_IMAGES_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Compresses an image file or Data URL to a maximum dimension (default 600px)
 * and JPEG quality 0.82. Reduces multi-megabyte photos to ~30-60KB.
 */
export async function compressImage(
  source: File | string,
  maxDimension = 600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    let srcUrl = '';
    let shouldRevoke = false;

    if (source instanceof File) {
      srcUrl = URL.createObjectURL(source);
      shouldRevoke = true;
    } else {
      srcUrl = source;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Downscale while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (shouldRevoke) URL.revokeObjectURL(srcUrl);
          resolve(typeof source === 'string' ? source : srcUrl);
          return;
        }

        // Draw image onto canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        if (shouldRevoke) URL.revokeObjectURL(srcUrl);
        resolve(compressedDataUrl);
      } catch (err) {
        if (shouldRevoke) URL.revokeObjectURL(srcUrl);
        // Fallback to original
        if (typeof source === 'string') resolve(source);
        else reject(err);
      }
    };

    img.onerror = (err) => {
      if (shouldRevoke) URL.revokeObjectURL(srcUrl);
      reject(err);
    };

    img.src = srcUrl;
  });
}

/**
 * Saves a guest photo into IndexedDB (virtually unlimited quota).
 */
export async function saveGuestImageToIndexedDB(guestId: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(GUEST_IMAGES_STORE, 'readwrite');
      const store = transaction.objectStore(GUEST_IMAGES_STORE);
      const request = store.put({ id: guestId, dataUrl, updatedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB:', err);
  }
}

/**
 * Loads all guest photos stored in IndexedDB.
 */
export async function loadAllGuestImagesFromIndexedDB(): Promise<Record<string, string>> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(GUEST_IMAGES_STORE, 'readonly');
      const store = transaction.objectStore(GUEST_IMAGES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as Array<{ id: string; dataUrl: string }> || [];
        const result: Record<string, string> = {};
        for (const item of items) {
          if (item.id && item.dataUrl) {
            result[item.id] = item.dataUrl;
          }
        }
        resolve(result);
      };

      request.onerror = () => {
        console.warn('Error reading from IndexedDB:', request.error);
        resolve({});
      };
    });
  } catch (err) {
    console.warn('IndexedDB unavailable:', err);
    return {};
  }
}

/**
 * Removes a guest photo from IndexedDB.
 */
export async function deleteGuestImageFromIndexedDB(guestId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(GUEST_IMAGES_STORE, 'readwrite');
      const store = transaction.objectStore(GUEST_IMAGES_STORE);
      const request = store.delete(guestId);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve(); // Non-blocking
    });
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }
}

/**
 * Clears all guest images from IndexedDB.
 */
export async function clearAllGuestImagesFromIndexedDB(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(GUEST_IMAGES_STORE, 'readwrite');
      const store = transaction.objectStore(GUEST_IMAGES_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Could not clear IndexedDB:', err);
  }
}
