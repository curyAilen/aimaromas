"use client";

import { useState } from "react";
import { ChevronDown, Download, Loader2 } from "lucide-react";

export interface CsvExportFile {
    /** Texto que se ve en el menú (cuando hay más de un archivo) */
    label: string;
    /** Nombre de la exportación en /api/export/[type] */
    type: string;
}

interface CsvExportButtonProps {
    files: CsvExportFile[];
    label?: string;
}

async function downloadCsv(type: string) {
    const res = await fetch(`/api/export/${type}`, { cache: "no-store" });
    if (!res.ok) {
        throw new Error(
            res.status === 401
                ? "Tu sesión venció. Volvé a iniciar sesión."
                : "No se pudo generar el archivo."
        );
    }

    const disposition = res.headers.get("Content-Disposition") || "";
    const match = /filename="?([^";]+)"?/.exec(disposition);
    const filename = match ? match[1] : `${type}.csv`;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CsvExportButton({ files, label = "Exportar CSV" }: CsvExportButtonProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function run(types: string[]) {
        setOpen(false);
        setLoading(true);
        try {
            for (const type of types) {
                await downloadCsv(type);
                // pequeña pausa para que el navegador acepte varias descargas seguidas
                if (types.length > 1) await new Promise((r) => setTimeout(r, 400));
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "No se pudo exportar.");
        } finally {
            setLoading(false);
        }
    }

    const single = files.length === 1;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => (single ? run([files[0].type]) : setOpen((v) => !v))}
                disabled={loading}
                className="flex items-center gap-2 bg-white border border-gray-200 text-text-primary rounded-full px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
                {label}
                {!single && <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />}
            </button>

            {open && !single && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-2 z-20 w-72 bg-white rounded-2xl border border-gray-100 shadow-popup p-1.5">
                        {files.map((file) => (
                            <button
                                key={file.type}
                                type="button"
                                onClick={() => run([file.type])}
                                className="w-full text-left px-3 py-2 rounded-xl text-sm text-text-primary hover:bg-gray-50 transition-colors"
                            >
                                {file.label}
                            </button>
                        ))}
                        <div className="border-t border-gray-100 my-1" />
                        <button
                            type="button"
                            onClick={() => run(files.map((f) => f.type))}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
                        >
                            Descargar todos
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
