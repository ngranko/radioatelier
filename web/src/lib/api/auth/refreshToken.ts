const STORAGE_KEY = 'refreshToken';

function set(token: string) {
    localStorage.setItem(STORAGE_KEY, token);
}

function get(): string | null {
    return localStorage.getItem(STORAGE_KEY);
}

function del() {
    localStorage.removeItem(STORAGE_KEY);
}

export default {
    set,
    get,
    del,
};
