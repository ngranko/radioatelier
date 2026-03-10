/**
 * MySQL SQL dump parser
 * Extracts INSERT statements and converts data to structured format
 */

export interface ParsedTable {
    tableName: string;
    columns: string[];
    rows: Record<string, unknown>[];
}

/**
 * Extract column definitions from CREATE TABLE statements
 */
function extractTableColumns(sqlContent: string): Map<string, string[]> {
    const tableColumns = new Map<string, string[]>();

    // Match CREATE TABLE statements
    const createTableRegex = /CREATE TABLE `(\w+)`\s*\(([\s\S]*?)\)\s*ENGINE/gi;

    let match;
    while ((match = createTableRegex.exec(sqlContent)) !== null) {
        const tableName = match[1];
        const columnsBlock = match[2];

        // Extract column names (lines that start with backtick)
        const columns: string[] = [];
        const lines = columnsBlock.split('\n');
        for (const line of lines) {
            const colMatch = line.trim().match(/^`(\w+)`/);
            if (colMatch) {
                columns.push(colMatch[1]);
            }
        }

        tableColumns.set(tableName, columns);
    }

    return tableColumns;
}

/**
 * Find INSERT statements in SQL, properly handling quoted strings
 */
function findInsertStatements(
    sqlContent: string,
): Array<{tableName: string; columnsStr?: string; valuesStr: string}> {
    const results: Array<{tableName: string; columnsStr?: string; valuesStr: string}> = [];

    // Find all INSERT INTO positions
    const insertPattern = /INSERT INTO `(\w+)`\s*(?:\(([^)]+)\)\s*)?VALUES\s+/gi;
    let match;

    while ((match = insertPattern.exec(sqlContent)) !== null) {
        const tableName = match[1];
        const columnsStr = match[2];
        const valuesStart = match.index + match[0].length;

        // Find the semicolon that ends this statement, skipping quoted strings
        const valuesEnd = findStatementEnd(sqlContent, valuesStart);
        if (valuesEnd === -1) {
            console.warn(`Could not find end of INSERT for table: ${tableName}`);
            continue;
        }

        const valuesStr = sqlContent.slice(valuesStart, valuesEnd);
        results.push({tableName, columnsStr, valuesStr});
    }

    return results;
}

/**
 * Find the semicolon that ends a statement, properly skipping quoted strings
 */
function findStatementEnd(sql: string, startIdx: number): number {
    let i = startIdx;
    let inString = false;
    let stringChar = '';

    while (i < sql.length) {
        const char = sql[i];

        // Handle escape sequences in strings
        if (inString && char === '\\') {
            i += 2; // Skip escaped character
            continue;
        }

        if (inString) {
            if (char === stringChar) {
                // Check for doubled quote (escape)
                if (i + 1 < sql.length && sql[i + 1] === stringChar) {
                    i += 2;
                    continue;
                }
                inString = false;
            }
            i++;
            continue;
        }

        if (char === "'" || char === '"') {
            inString = true;
            stringChar = char;
            i++;
            continue;
        }

        if (char === ';') {
            return i;
        }

        i++;
    }

    return -1;
}

/**
 * Parse a MySQL dump file and extract INSERT statements
 */
export function parseSqlDump(sqlContent: string): Map<string, ParsedTable> {
    const tables = new Map<string, ParsedTable>();

    // First, extract column definitions from CREATE TABLE statements
    const tableColumns = extractTableColumns(sqlContent);

    // Find all INSERT statements with proper string handling
    const insertStatements = findInsertStatements(sqlContent);

    for (const {tableName, columnsStr, valuesStr} of insertStatements) {
        // Get columns either from explicit declaration or from CREATE TABLE
        let columns: string[];
        if (columnsStr) {
            columns = columnsStr.split(',').map(col => col.trim().replace(/`/g, ''));
        } else {
            const tableColDef = tableColumns.get(tableName);
            if (!tableColDef) {
                console.warn(`No column definition found for table: ${tableName}`);
                continue;
            }
            columns = tableColDef;
        }

        // Parse value rows
        const rows = parseValues(valuesStr, columns);

        // Merge with existing table data if any
        if (tables.has(tableName)) {
            const existing = tables.get(tableName)!;
            existing.rows.push(...rows);
        } else {
            tables.set(tableName, {tableName, columns, rows});
        }
    }

    return tables;
}

/**
 * Parse VALUES clause into array of row objects
 */
function parseValues(valuesStr: string, columns: string[]): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];

    // Split by ),( to get individual rows, handling nested parentheses
    const rowStrings = splitValueRows(valuesStr);

    for (const rowStr of rowStrings) {
        const values = parseRowValues(rowStr);

        if (values.length !== columns.length) {
            console.warn(
                `Column count mismatch for row: expected ${columns.length}, got ${values.length}`,
            );
            continue;
        }

        const row: Record<string, unknown> = {};
        for (let i = 0; i < columns.length; i++) {
            row[columns[i]] = values[i];
        }
        rows.push(row);
    }

    return rows;
}

/**
 * Split VALUES string into individual row strings
 */
function splitValueRows(valuesStr: string): string[] {
    const rows: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let i = 0;

    while (i < valuesStr.length) {
        const char = valuesStr[i];

        // Handle escape sequences in strings
        if (inString && char === '\\') {
            current += char;
            if (i + 1 < valuesStr.length) {
                current += valuesStr[i + 1];
                i += 2;
                continue;
            }
        }

        if (inString) {
            current += char;
            if (char === stringChar) {
                // Check for doubled quote (escape)
                if (i + 1 < valuesStr.length && valuesStr[i + 1] === stringChar) {
                    current += valuesStr[i + 1];
                    i += 2;
                    continue;
                }
                inString = false;
            }
            i++;
            continue;
        }

        if (char === "'" || char === '"') {
            inString = true;
            stringChar = char;
            current += char;
            i++;
            continue;
        }

        if (char === '(') {
            if (depth === 0) {
                current = '';
            } else {
                current += char;
            }
            depth++;
            i++;
            continue;
        }

        if (char === ')') {
            depth--;
            if (depth === 0) {
                rows.push(current);
                current = '';
            } else {
                current += char;
            }
            i++;
            continue;
        }

        if (depth > 0) {
            current += char;
        }
        i++;
    }

    return rows;
}

/**
 * Parse a single row's values string into array of values
 */
function parseRowValues(rowStr: string): unknown[] {
    const values: unknown[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let i = 0;

    while (i < rowStr.length) {
        const char = rowStr[i];

        // Handle escape sequences
        if (inString && char === '\\') {
            // Keep the escape sequence as-is for now, we'll process it later
            current += char;
            if (i + 1 < rowStr.length) {
                current += rowStr[i + 1];
                i += 2;
                continue;
            }
        }

        if (inString) {
            if (char === stringChar) {
                // Check for doubled quote (escape)
                if (i + 1 < rowStr.length && rowStr[i + 1] === stringChar) {
                    current += char;
                    i += 2;
                    continue;
                }
                inString = false;
                i++;
                continue;
            }
            current += char;
            i++;
            continue;
        }

        if (char === "'" || char === '"') {
            inString = true;
            stringChar = char;
            i++;
            continue;
        }

        if (char === ',') {
            values.push(parseValue(current.trim()));
            current = '';
            i++;
            continue;
        }

        current += char;
        i++;
    }

    // Don't forget the last value
    if (current.trim() || values.length > 0) {
        values.push(parseValue(current.trim()));
    }

    return values;
}

/**
 * Convert a latin1-decoded string back to UTF-8
 * When reading file as latin1, UTF-8 multi-byte sequences become separate chars.
 * This converts them back to proper UTF-8 string.
 */
function latin1ToUtf8(str: string): string {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Parse a single value string to its appropriate type
 */
function parseValue(valueStr: string): unknown {
    // NULL
    if (valueStr.toUpperCase() === 'NULL') {
        return null;
    }

    // Binary data with _binary prefix
    // The dump format is: _binary 'raw bytes here'
    if (valueStr.startsWith('_binary ')) {
        const binaryContent = valueStr.slice(8).trim();
        // The content is the raw string between quotes (already unquoted)
        // Convert to hex for storage
        return stringToHex(binaryContent);
    }

    // Hex data: 0xHEXSTRING or X'HEXSTRING'
    if (valueStr.startsWith('0x') || valueStr.startsWith('0X')) {
        return valueStr.slice(2).toLowerCase();
    }
    if ((valueStr.startsWith("X'") || valueStr.startsWith("x'")) && valueStr.endsWith("'")) {
        return valueStr.slice(2, -1).toLowerCase();
    }

    // Keep numeric strings as strings - let transform config decide the type
    // String (already unquoted by parseRowValues)
    // Convert from latin1 bytes back to UTF-8 for proper text encoding
    return latin1ToUtf8(valueStr);
}

/**
 * Convert a string with possible escape sequences to hex
 * The string contains raw bytes (read as Latin-1) with MySQL escape sequences
 */
function stringToHex(str: string): string {
    const bytes: number[] = [];
    let i = 0;

    while (i < str.length) {
        if (str[i] === '\\' && i + 1 < str.length) {
            const next = str[i + 1];
            // MySQL escape sequences
            switch (next) {
                case '0':
                    bytes.push(0);
                    break;
                case 'n':
                    bytes.push(10);
                    break;
                case 'r':
                    bytes.push(13);
                    break;
                case 't':
                    bytes.push(9);
                    break;
                case 'Z':
                    bytes.push(26);
                    break;
                case '\\':
                    bytes.push(92);
                    break;
                case "'":
                    bytes.push(39);
                    break;
                case '"':
                    bytes.push(34);
                    break;
                default:
                    // Unknown escape, use the byte value of the character
                    bytes.push(next.charCodeAt(0) & 0xff);
            }
            i += 2;
        } else {
            // Get the byte value of the character (works for Latin-1 encoded strings)
            bytes.push(str.charCodeAt(i) & 0xff);
            i++;
        }
    }

    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert binary ULID (hex string) to standard ULID string
 * ULIDs are 16 bytes (128 bits), typically encoded as 26 chars in Crockford's Base32
 */
export function hexToUlid(hex: string): string {
    // For simplicity in migration, we'll use the hex representation directly
    // since we just need a unique string identifier for mysqlId
    return hex.toLowerCase();
}

/**
 * Parse MySQL timestamp string to milliseconds since epoch
 */
export function mysqlTimestampToMs(timestamp: string | null): number {
    if (!timestamp) {
        console.warn('Null timestamp encountered, using current time');
        return Date.now();
    }
    if (timestamp.startsWith('0000-00-00')) {
        return Date.now();
    }
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        console.warn(`Invalid timestamp: ${timestamp}, using current time`);
        return Date.now();
    }
    return date.getTime();
}
