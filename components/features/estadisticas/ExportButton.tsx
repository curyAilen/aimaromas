"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
    data: Record<string, any>[];
    filename: string;
    columns: { key: string; label: string }[];
}

export function ExportButton({ data, filename, columns }: ExportButtonProps) {
    function handleExport() {
        if (data.length === 0) return;

        // Encabezados
        const headers = columns.map((c) => `"${c.label}"`).join(",");

        // Filas
        const rows = data.map((row) =>
            columns
                .map((col) => {
                    const value = row[col.key];
                    if (value === null || value === undefined) return '""';
                    const str = String(value).replace(/"/g, '""');
                    return `"${str}"`;
                })
                .join(",")
        );

        const csv = [headers, ...rows].join("\n");

        // Descargar
        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <button
            onClick={handleExport}
            disabled={data.length === 0}
            className="flex items-center gap-2 bg-white border border-gray-200 text-text-primary rounded-full px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
        </button>
    );
}