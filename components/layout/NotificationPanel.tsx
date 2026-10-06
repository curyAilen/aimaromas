"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ShoppingCart, DollarSign, AlertCircle, X } from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";

interface Notification {
    id_order: number;
    total: string;
    client_name: string;
    createdAt?: string;
    paid_at?: string;
}

interface NotificationsData {
    newOrders: Notification[];
    paidOrders: Notification[];
    unpaidDelivered: { count: number; total: string };
    unreadCount: number;
}

const EMPTY_DATA: NotificationsData = {
    newOrders: [],
    paidOrders: [],
    unpaidDelivered: { count: 0, total: "0" },
    unreadCount: 0,
};

export function NotificationPanel() {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<NotificationsData>(EMPTY_DATA);
    const [loading, setLoading] = useState(true);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/notifications");
                if (!res.ok) throw new Error("Error al cargar notificaciones");
                const json = await res.json();

                setData({
                    newOrders: Array.isArray(json?.newOrders) ? json.newOrders : [],
                    paidOrders: Array.isArray(json?.paidOrders) ? json.paidOrders : [],
                    unpaidDelivered: json?.unpaidDelivered || { count: 0, total: "0" },
                    unreadCount: Number(json?.unreadCount) || 0,
                });
            } catch (error) {
                console.error(error);
                setData(EMPTY_DATA);
            } finally {
                setLoading(false);
            }
        }
        load();

        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const hasNotifications = data.unreadCount > 0;

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setOpen(!open)}
                className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors relative"
            >
                <Bell className="w-4 h-4 text-text-primary" />
                {hasNotifications && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent-pink rounded-full border-2 border-white" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-popup border border-gray-100 overflow-hidden z-50">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-text-primary">
                            Notificaciones
                        </h3>
                        <button
                            onClick={() => setOpen(false)}
                            className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center"
                        >
                            <X className="w-3 h-3 text-text-secondary" />
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-xs text-text-secondary">
                                Cargando...
                            </div>
                        ) : (
                            <>
                                {Number(data.unpaidDelivered.count) > 0 && (
                                    <Link
                                        href="/admin/pedidos"
                                        className="block p-4 bg-red-50 border-b border-red-100 hover:bg-red-100 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-red-700">
                                                    {data.unpaidDelivered.count} pedido
                                                    {Number(data.unpaidDelivered.count) !== 1 ? "s" : ""}{" "}
                                                    entregado
                                                    {Number(data.unpaidDelivered.count) !== 1 ? "s" : ""}{" "}
                                                    sin pagar
                                                </p>
                                                <p className="text-xs text-red-600 mt-0.5">
                                                    Total: {formatCurrency(data.unpaidDelivered.total)}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                )}

                                {data.newOrders.length > 0 && (
                                    <div className="border-b border-gray-100">
                                        <p className="px-4 py-2 text-[10px] font-semibold text-text-secondary uppercase tracking-wide bg-gray-50">
                                            Pedidos nuevos (24h)
                                        </p>
                                        {data.newOrders.map((o) => (
                                            <Link
                                                key={o.id_order}
                                                href={`/admin/pedidos/${o.id_order}`}
                                                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-accent-pink/10 flex items-center justify-center flex-shrink-0">
                                                    <ShoppingCart className="w-4 h-4 text-accent-pink" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-text-primary truncate">
                                                        Pedido #{o.id_order} — {o.client_name}
                                                    </p>
                                                    <p className="text-xs text-text-secondary">
                                                        {formatCurrency(o.total)}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {data.paidOrders.length > 0 && (
                                    <div>
                                        <p className="px-4 py-2 text-[10px] font-semibold text-text-secondary uppercase tracking-wide bg-gray-50">
                                            Pagos recibidos (24h)
                                        </p>
                                        {data.paidOrders.map((o) => (
                                            <Link
                                                key={o.id_order}
                                                href={`/admin/pedidos/${o.id_order}`}
                                                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                    <DollarSign className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-text-primary truncate">
                                                        Pedido #{o.id_order} — {o.client_name}
                                                    </p>
                                                    <p className="text-xs text-text-secondary">
                                                        {formatCurrency(o.total)}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {data.newOrders.length === 0 &&
                                    data.paidOrders.length === 0 &&
                                    Number(data.unpaidDelivered.count) === 0 && (
                                        <div className="p-8 text-center">
                                            <p className="text-xs text-text-secondary">
                                                Todo al día ✨
                                            </p>
                                        </div>
                                    )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}