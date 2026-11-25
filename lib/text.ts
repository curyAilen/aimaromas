/** Limpieza de textos que se cargan a mano: sin espacios de más al borde ni dobles. */
export function cleanLine(value: unknown): string {
    return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();
}

/** Para descripciones: respeta los saltos de línea, saca espacios sobrantes. */
export function cleanParagraphs(value: unknown): string {
    return String(value ?? "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
