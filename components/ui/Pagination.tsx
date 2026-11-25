"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 15;

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

/** Números de página a mostrar: 1 … 4 5 6 … 20 */
function visiblePages(page: number, totalPages: number): (number | "gap")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const result: (number | "gap")[] = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) result.push("gap");
        result.push(p);
    });
    return result;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <nav
            aria-label="Paginación"
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2"
        >
            <p className="text-xs text-text-secondary">
                Mostrando {from}–{to} de {total}
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    aria-label="Página anterior"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-100 text-text-secondary hover:border-accent-pink/50 disabled:opacity-40 disabled:hover:border-gray-100 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {visiblePages(page, totalPages).map((p, i) =>
                    p === "gap" ? (
                        <span key={`gap-${i}`} className="px-1 text-xs text-text-secondary">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            aria-current={p === page ? "page" : undefined}
                            className={`min-w-8 h-8 px-2 rounded-full text-xs font-medium transition-all ${p === page
                                    ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                    : "bg-white border border-gray-100 text-text-secondary hover:border-accent-pink/50"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    aria-label="Página siguiente"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-100 text-text-secondary hover:border-accent-pink/50 disabled:opacity-40 disabled:hover:border-gray-100 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </nav>
    );
}

/**
 * Parte una lista en páginas de 15 filas. Vuelve a la página 1 cuando cambia
 * algún filtro (resetKeys) y nunca se queda en una página que ya no existe.
 */
export function usePagination<T>(items: T[], resetKeys: unknown[] = [], pageSize = PAGE_SIZE) {
    // Si cambia algún filtro, se vuelve a la página 1 (se ajusta durante el render, sin efectos)
    const key = JSON.stringify(resetKeys);
    const [state, setState] = useState({ page: 1, key });
    if (state.key !== key) setState({ page: 1, key });

    const page = state.key === key ? state.page : 1;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const current = Math.min(page, totalPages);
    const pageItems = items.slice((current - 1) * pageSize, current * pageSize);

    const pagination = (
        <Pagination
            page={current}
            totalPages={totalPages}
            total={items.length}
            pageSize={pageSize}
            onPageChange={(p) => {
                setState({ page: p, key });
                window.scrollTo({ top: 0, behavior: "smooth" });
            }}
        />
    );

    return { pageItems, pagination };
}
