/**
 * Utilidades para generar CSV pensados para abrirse en Excel (Argentina):
 * - Separador punto y coma (;)
 * - Decimales con coma
 * - UTF-8 con BOM (para que se vean bien los acentos y la ñ)
 * - Saltos de línea CRLF
 */

export const CSV_SEPARATOR = ";";

export interface CsvColumn<T> {
    header: string;
    value: (row: T) => unknown;
}

/** Texto que Excel podría interpretar como fórmula. Se neutraliza con un apóstrofe. */
function neutralizeFormula(text: string): string {
    if (/^[=@\t\r]/.test(text)) return `'${text}`;
    // + o - solos son válidos en teléfonos y números; solo se bloquean si siguen letras/símbolos
    if (/^[+-]/.test(text) && !/^[+-][\d\s().-]*$/.test(text)) return `'${text}`;
    return text;
}

function formatCell(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "Sí" : "No";
    if (typeof value === "number") {
        return Number.isFinite(value) ? String(value).replace(".", ",") : "";
    }
    if (value instanceof Date) return value.toISOString().slice(0, 19).replace("T", " ");

    const text = neutralizeFormula(String(value));
    if (/[;"\r\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
    const lines: string[] = [
        columns.map((c) => formatCell(c.header)).join(CSV_SEPARATOR),
    ];
    for (const row of rows) {
        lines.push(columns.map((c) => formatCell(c.value(row))).join(CSV_SEPARATOR));
    }
    return "﻿" + lines.join("\r\n") + "\r\n";
}

/** Convierte un DECIMAL de MySQL (llega como texto) a número, o null si está vacío. */
export function num(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/** 1 / 0 / null de MySQL → true / false / null */
export function flag(value: unknown): boolean | null {
    if (value === null || value === undefined) return null;
    return Number(value) === 1;
}
