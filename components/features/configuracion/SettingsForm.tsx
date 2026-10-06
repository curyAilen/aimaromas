"use client";

import { useEffect, useState } from "react";
import { Save, Truck, Cake, Loader2 } from "lucide-react";

export function SettingsForm() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/settings");
                const data = await res.json();
                setSettings(data.settings || {});
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    function update(key: string, value: string) {
        setSettings((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al guardar");
                setSaving(false);
                return;
            }

            setMessage("✅ Configuración guardada");
            setTimeout(() => setMessage(""), 3000);
        } catch {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="text-center py-16 text-text-secondary text-sm">
                Cargando configuración...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Configuración</h1>
                <p className="text-sm text-text-secondary mt-1">
                    Ajustes generales del sistema (solo CEO)
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Envío */}
                <section className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center">
                            <Truck className="w-5 h-5 text-accent-pink" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-text-primary">
                                Envío
                            </h2>
                            <p className="text-xs text-text-secondary">
                                Configuración del envío a domicilio
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Monto para envío gratis ($)">
                            <input
                                type="number"
                                min="0"
                                value={settings.free_shipping_threshold || "80000"}
                                onChange={(e) =>
                                    update("free_shipping_threshold", e.target.value)
                                }
                                className="input"
                            />
                            <p className="text-[10px] text-text-secondary mt-1">
                                Los pedidos que superen este monto tienen envío gratis
                            </p>
                        </Field>

                        <Field label="Costo de envío ($)">
                            <input
                                type="number"
                                min="0"
                                value={settings.delivery_cost || "5000"}
                                onChange={(e) => update("delivery_cost", e.target.value)}
                                className="input"
                            />
                            <p className="text-[10px] text-text-secondary mt-1">
                                Se cobra si el pedido NO supera el monto de envío gratis
                            </p>
                        </Field>
                    </div>
                </section>

                {/* Cumpleaños */}
                <section className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center">
                            <Cake className="w-5 h-5 text-accent-pink" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-text-primary">
                                Cumpleaños
                            </h2>
                            <p className="text-xs text-text-secondary">
                                Mensaje y descuento para clientes que cumplen años
                            </p>
                        </div>
                    </div>

                    <Field label="Tipo de descuento">
                        <select
                            value={settings.birthday_discount_type || "percent"}
                            onChange={(e) =>
                                update("birthday_discount_type", e.target.value)
                            }
                            className="input"
                        >
                            <option value="percent">Porcentaje (%)</option>
                            <option value="amount">Monto fijo ($)</option>
                        </select>
                    </Field>

                    {settings.birthday_discount_type === "amount" ? (
                        <Field label="Descuento ($)">
                            <input
                                type="number"
                                min="0"
                                value={settings.birthday_discount_amount || "0"}
                                onChange={(e) =>
                                    update("birthday_discount_amount", e.target.value)
                                }
                                className="input"
                            />
                        </Field>
                    ) : (
                        <Field label="Descuento (%)">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={settings.birthday_discount_percent || "15"}
                                onChange={(e) =>
                                    update("birthday_discount_percent", e.target.value)
                                }
                                className="input"
                            />
                        </Field>
                    )}

                    <Field label="Mensaje de felicitación">
                        <textarea
                            rows={5}
                            value={settings.birthday_message || ""}
                            onChange={(e) => update("birthday_message", e.target.value)}
                            className="input resize-none"
                        />
                        <div className="text-[10px] text-text-secondary mt-2 space-y-0.5">
                            <p>
                                <b>Variables disponibles:</b>
                            </p>
                            <p>
                                • <code className="bg-gray-100 px-1 rounded">{"{nombre}"}</code> →
                                primer nombre del cliente
                            </p>
                            <p>
                                • <code className="bg-gray-100 px-1 rounded">
                                    {"{nombre_completo}"}
                                </code>{" "}
                                → nombre completo
                            </p>
                            <p>
                                • <code className="bg-gray-100 px-1 rounded">{"{descuento}"}</code>{" "}
                                → descuento configurado arriba
                            </p>
                        </div>
                    </Field>
                </section>

                {/* Mensajes */}
                {message && (
                    <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-2xl px-4 py-3">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
                        {error}
                    </div>
                )}

                {/* Botón guardar */}
                <div className="flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </form>

            <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.15s;
          background: #fff;
        }
        .input:focus {
          border-color: rgba(255, 77, 141, 0.5);
          box-shadow: 0 0 0 2px rgba(255, 77, 141, 0.1);
        }
        code {
          font-family: monospace;
        }
      `}</style>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
                {label}
            </label>
            {children}
        </div>
    );
}