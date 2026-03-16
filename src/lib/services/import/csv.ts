export function parseCsv(text: string, separator: string): string[][] {
    if (!separator || separator.length !== 1) {
        throw new Error('Separator must be a single character');
    }

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                currentCell += '"';
                i += 1;
                continue;
            }
            inQuotes = !inQuotes;
            continue;
        }

        if (!inQuotes && char === separator) {
            currentRow.push(currentCell);
            currentCell = '';
            continue;
        }

        if (!inQuotes && (char === '\n' || char === '\r')) {
            if (char === '\r' && next === '\n') {
                i += 1;
            }
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
            continue;
        }

        currentCell += char;
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }

    return rows.filter(row => row.some(cell => cell.trim().length > 0));
}

export async function readCsvFile(file: File) {
    return await file.text();
}
