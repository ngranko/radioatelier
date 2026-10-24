// Shared object links are the only app pages an anonymous viewer may open.
export function allowsAnonymousViewer(pathname: string): boolean {
    return pathname.startsWith('/object/');
}

export function buildLoginUrl(url: URL): string {
    return `/login?ref=${encodeURIComponent(`${url.pathname}${url.search}`)}`;
}
