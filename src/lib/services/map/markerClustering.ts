const STORAGE_KEY = 'map-marker-clustering';

type ClusteringListener = (enabled: boolean) => void;

const listeners = new Set<ClusteringListener>();
let enabled = readStored();

export function isMarkerClusteringEnabled(): boolean {
    return enabled;
}

export function setMarkerClusteringEnabled(next: boolean): void {
    if (enabled === next) {
        return;
    }
    enabled = next;
    persist(next);
    for (const listener of listeners) {
        listener(enabled);
    }
}

export function subscribeMarkerClustering(listener: ClusteringListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function readStored(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
        return true;
    }
}

function persist(value: boolean): void {
    try {
        localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    } catch {
        // Private mode and some test environments reject localStorage writes.
    }
}
