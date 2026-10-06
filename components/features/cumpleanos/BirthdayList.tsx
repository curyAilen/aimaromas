"use client";

import { useEffect, useState } from "react";
import { Cake, MessageCircle, Phone, Mail, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/whatsapp";

interface Client {
    id_client: number;
    name: string;
    phone: string;
    email: string | null;
    birthday: string;
    next_birthday: string;
    days_until: number;
    is_today: boolean;
    age: number;
    notes: string | null;
}

interface Settings {
    birthday_message: string;
    birthday_discount_percent: string;
    birthday_discount_amount: string;
    birthday_discount_type: string;
}

type Range = "today" | "7days" | "30days" | "month" | "all";

export function BirthdayList() {
    const [clients, setClients] = useState<Client[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [range, setRange] = useState<Range>("month");
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const res = await fetch(`/api/birthdays?range=${range}`);
            const data = await res.json();
            setClients(data.clients || []);
            setSettings(data.settings || null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [range]);

    function buildMessage(client: Client): string {
        if (!settings) return "";

        const discount =
            settings.birthday_discount_type === "amount"
                ? formatCurrency(settings.birthday_discount_amount)
                : `${settings.birthday_discount_percent}%`;

        return settings.birthday_message
            .replace(/{nombre}/g, client.name.split(" ")[0]) // Solo el primer nombre
            .replace(/{descuento}/g, discount)
            .replace(/{nombre_completo}/g, client.name);
    }

    function sendWhatsApp(client: Client) {
        const message = buildMessage(client);
        const phone = client.phone.replace(/\D/g, ""); // Solo números
        const fullPhone = phone.startsWith("54") ? phone : `549${phone}`;
        const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    }

    const ranges: { value: Range; label: string }[] = [
        { value: "today", label: "Hoy" },
        { value: "7days", label: "Próximos 7 días" },
        { value: "30days", label: "Próximos 30 días" },
        { value: "month", label: "Este mes" },
        { value: "all", label: "Todos" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">
                    Cumpleaños 🎂
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                    Enviá felicitaciones con descuento a tus clientes
                </p>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {ranges.map((r) => (
                    <button
                        key={r.value}
                        onClick={() => setRange(r.value)}
                        className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${range === r.value
                                ? "bg-gradient-main text-white shadow-md shadow-accent-pink/20"
                                : "bg-white text-text-secondary border border-gray-100 hover:border-accent-pink/50"
                            }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Listado */}
            {loading ? (
                <div className="text-center py-16 text-text-secondary text-sm">
                    Cargando...
                </div>
            ) : clients.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-16 text-center">
                    <Cake className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-text-secondary text-sm">
                        No hay cumpleaños en este rango
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clients.map((client) => (
                        <div
                            key={client.id_client}
                            className={`bg-white rounded-3xl shadow-card border p-5 ${client.is_today
                                    ? "border-accent-pink ring-2 ring-accent-pink/20"
                                    : "border-gray-100/50"
                                }`}
                        >
                            {client.is_today && (
                                <div className="flex items-center gap-2 mb-3 text-accent-pink">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wide">
                                        ¡Cumple hoy!
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-main flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {client.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-text-primary truncate">
                                        {client.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                                        <span className="flex items-center gap-1">
                                            <Cake className="w-3 h-3" />
                                            {new Date(client.next_birthday).toLocaleDateString(
                                                "es-AR",
                                                { day: "2-digit", month: "long" }
                                            )}
                                        </span>
                                        <span>
                                            {client.is_today
                                                ? "HOY"
                                                : client.days_until === 1
                                                    ? "Mañana"
                                                    : `En ${client.days_until} días`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 mb-4 text-xs text-text-secondary">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    {client.phone}
                                </div>
                                {client.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3 h-3" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => sendWhatsApp(client)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-main text-white rounded-full px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Enviar felicitación
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}