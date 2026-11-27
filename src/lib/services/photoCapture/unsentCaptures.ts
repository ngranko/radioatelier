const DATABASE_NAME = 'photoCaptures';
const STORE_NAME = 'unsent';

export interface CaptureDraft {
    image: Blob;
    latitude: number;
    longitude: number;
    address: string | null;
    city: string | null;
    country: string | null;
}

export interface UnsentCapture extends CaptureDraft {
    id: string;
    createdAt: number;
}

// A photo taken through the browser's camera never reaches the camera roll, so
// one that failed to upload lives here until it is sent or dismissed.
export async function keepUnsentCapture(draft: CaptureDraft) {
    const capture: UnsentCapture = {...draft, id: crypto.randomUUID(), createdAt: Date.now()};
    await runInStore('readwrite', store => store.add(capture));
}

export async function listUnsentCaptures(): Promise<UnsentCapture[]> {
    const captures = await runInStore<UnsentCapture[]>('readonly', store => store.getAll());
    return captures.sort((left, right) => right.createdAt - left.createdAt);
}

export async function forgetUnsentCapture(id: string) {
    await runInStore('readwrite', store => store.delete(id));
}

async function runInStore<T>(
    mode: IDBTransactionMode,
    operate: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
    const database = await openDatabase();
    try {
        return await settle<T>(
            operate(database.transaction(STORE_NAME, mode).objectStore(STORE_NAME)),
        );
    } finally {
        database.close();
    }
}

function openDatabase(): Promise<IDBDatabase> {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, {keyPath: 'id'});
    return settle(request);
}

function settle<T>(request: IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
