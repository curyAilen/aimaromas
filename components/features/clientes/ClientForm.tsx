"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { Client } from "@/lib/types";

interface ClientFormProps {
    clientId?: string; // si viene, es edición
}

export function ClientForm({ clientId }: ClientFormProps) {
    const router = useRouter();
    const isEdit = !!clientId;

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        birthday: "",
        notes: "",
    });
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Si es edición, cargamos los datos
    useEffect(() => {
        if (!clientId) return;

        async function load() {
            try {
                const res = await fetch(`/api/clients/${clientId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                const client: Client = data.client;
                setForm({
                    name: client.name || "",
                    email: client.email || "",
                    phone: client.phone || "",
                    address: client.address || "",
                    birthday: client.birthday
                        ? new Date(client.birthday).toISOString().slice(0, 10)
                        : "",
                    notes: client.notes || "",
                });
            } catch {
                setError("No se pudo cargar el cliente");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [clientId]);

    function update(field: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const url = isEdit ? `/api/clients/${clientId}` : "/api/clients";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al guardar");
                setSaving(false);
                return;
            }

            router.push(`/admin/clientes/${clientId}`);
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
                    href="/admin/clientes"
                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-text-primary" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        {isEdit ? "Editar cliente" : "Nuevo cliente"}
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {isEdit
                            ? "Modificá los datos del cliente"
                            : "Completá los datos para crear un cliente"}
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
                            placeholder="Juan Pérez"
                            className="input"
                        />
                    </Field>

                    <Field label="Teléfono * (con código de área)">
                        <input
                            type="text"
                            required
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            placeholder="1173735090"
                            className="input"
                        />
                    </Field>

                    <Field label="Email">
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            placeholder="juan@email.com"
                            className="input"
                        />
                    </Field>

                    <Field label="Cumpleaños">
                        <input
                            type="date"
                            value={form.birthday}
                            onChange={(e) => update("birthday", e.target.value)}
                            className="input"
                        />
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
                        placeholder="Preferencias, alergias, aromas favoritos..."
                        rows={4}
                        className="input resize-none"
                    />
                </Field>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-2.5">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link
                        href={`/admin/clientes/${clientId}`}
                        className="px-5 py-2.5 rounded-full text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}
                    </button>
                </div>
            </form>

            {/* Estilo reutilizable para los inputs */}
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