"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface ResellerFormProps {
    resellerId?: string;
}

export function ResellerForm({ resellerId }: ResellerFormProps) {
    const router = useRouter();
    const isEdit = !!resellerId;

    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        dni: "",
        address: "",
        notes: "",
        default_commission_percent: "20",
        active: true,
    });
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!resellerId) return;

        async function load() {
            try {
                const res = await fetch(`/api/resellers/${resellerId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                const r = data.reseller;
                setForm({
                    name: r.name || "",
                    phone: r.phone || "",
                    email: r.email || "",
                    dni: r.dni || "",
                    address: r.address || "",
                    notes: r.notes || "",
                    default_commission_percent: String(
                        r.default_commission_percent ?? "20"
                    ),
                    active: r.active === 1,
                });
            } catch {
                setError("No se pudo cargar la revendedora");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [resellerId]);

    function update(field: keyof typeof form, value: string | boolean) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const url = isEdit
                ? `/api/resellers/${resellerId}`
                : "/api/resellers";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    phone: form.phone,
                    email: form.email,
                    dni: form.dni,
                    address: form.address,
                    notes: form.notes,
                    default_commission_percent: Number(form.default_commission_percent) || 0,
                    active: form.active,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al guardar");
                setSaving(false);
                return;
            }

            router.push("/admin/revendedoras");
            router.refresh();
        } catch {
            setError("Error de conexión");
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8 text-center text-text-secondary text-sm">
                Cargando...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/revendedoras"
                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-text-primary" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        {isEdit ? "Editar revendedora" : "Nueva revendedora"}
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {isEdit
                            ? "Modificá los datos de la revendedora"
                            : "Completá los datos para crear una revendedora"}
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-5"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Nombre completo *">
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            placeholder="Patricia Caffaro"
                            className="input"
                        />
                    </Field>

                    <Field label="Teléfono">
                        <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            placeholder="1134372822"
                            className="input"
                        />
                    </Field>

                    <Field label="Email">
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            placeholder="patricia@email.com"
                            className="input"
                        />
                    </Field>

                    <Field label="DNI">
                        <input
                            type="text"
                            value={form.dni}
                            onChange={(e) => update("dni", e.target.value)}
                            placeholder="17363043"
                            className="input"
                        />
                    </Field>

                    <Field label="Comisión por defecto (%)">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={form.default_commission_percent}
                            onChange={(e) =>
                                update("default_commission_percent", e.target.value)
                            }
                            placeholder="20"
                            className="input"
                        />
                        <p className="text-[10px] text-text-secondary mt-1">
                            Este % se aplicará automáticamente en los pedidos nuevos
                        </p>
                    </Field>
                </div>

                <Field label="Dirección">
                    <input
                        type="text"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        placeholder="Av. Siempre Viva 742"
                        className="input"
                    />
                </Field>

                <Field label="Notas">
                    <textarea
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        placeholder="Observaciones, acuerdos, etc."
                        rows={3}
                        className="input resize-none"
                    />
                </Field>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="active"
                        checked={form.active}
                        onChange={(e) => update("active", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-accent-pink focus:ring-accent-pink/20"
                    />
                    <label htmlFor="active" className="text-sm text-text-primary">
                        Revendedora activa
                    </label>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-2.5">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link
                        href="/admin/revendedoras"
                        className="px-5 py-2.5 rounded-full text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saving
                            ? "Guardando..."
                            : isEdit
                                ? "Guardar cambios"
                                : "Crear revendedora"}
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