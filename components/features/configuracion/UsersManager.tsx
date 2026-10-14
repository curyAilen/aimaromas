"use client";

import { useEffect, useState } from "react";
import {
    Users,
    Plus,
    Power,
    PowerOff,
    X,
    Loader2,
    Check,
    Pencil,
    Save,
} from "lucide-react";

interface User {
    id_user: number;
    email: string;
    name: string;
    role: "CEO" | "GERENTA";
    active: number;
    createdAt: string;
}

export function UsersManager() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Para editar usuario
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        role: "GERENTA" as "CEO" | "GERENTA",
        newPassword: "",
    });
    const [editingSaving, setEditingSaving] = useState(false);
    const [editError, setEditError] = useState("");

    // Formulario de creación
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "GERENTA" as "CEO" | "GERENTA",
    });

    async function loadUsers() {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (res.ok) setUsers(data.users || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al crear usuario");
                setSaving(false);
                return;
            }

            setSuccess("✅ Usuario creado correctamente");
            setForm({ name: "", email: "", password: "", role: "GERENTA" });
            setShowCreateForm(false);
            await loadUsers();
            setTimeout(() => setSuccess(""), 3000);
        } catch {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(user: User) {
        const action = user.active === 1 ? "desactivar" : "reactivar";
        if (
            !confirm(
                `¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.name}?`
            )
        )
            return;

        try {
            await fetch(`/api/users/${user.id_user}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: user.active === 1 ? false : true }),
            });
            await loadUsers();
        } catch (error) {
            console.error(error);
            alert("Error al actualizar");
        }
    }

    function openEditModal(user: User) {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            role: user.role,
            newPassword: "",
        });
        setEditError("");
    }

    function closeEditModal() {
        setEditingUser(null);
        setEditError("");
    }

    async function handleSaveEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingUser) return;

        setEditError("");
        setEditingSaving(true);

        try {
            const body: any = {
                name: editForm.name,
                email: editForm.email,
                role: editForm.role,
            };

            if (editForm.newPassword && editForm.newPassword !== "") {
                if (editForm.newPassword.length < 6) {
                    setEditError("La contraseña debe tener al menos 6 caracteres");
                    setEditingSaving(false);
                    return;
                }
                body.password = editForm.newPassword;
            }

            const res = await fetch(`/api/users/${editingUser.id_user}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setEditError(data.error || "Error al guardar");
                setEditingSaving(false);
                return;
            }

            setSuccess("✅ Usuario actualizado correctamente");
            closeEditModal();
            await loadUsers();
            setTimeout(() => setSuccess(""), 3000);
        } catch {
            setEditError("Error de conexión");
        } finally {
            setEditingSaving(false);
        }
    }

    return (
        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent-pink" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-text-primary">
                            Usuarios
                        </h2>
                        <p className="text-xs text-text-secondary">
                            Gestioná quién puede acceder al panel
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-4 py-2 text-sm font-medium hover:opacity-90 transition-all active:scale-95"
                >
                    {showCreateForm ? (
                        <X className="w-4 h-4" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}
                    {showCreateForm ? "Cancelar" : "Nuevo usuario"}
                </button>
            </div>

            {/* Form de creación */}
            {showCreateForm && (
                <form
                    onSubmit={handleCreate}
                    className="bg-gray-50/50 rounded-2xl p-5 space-y-4 border border-gray-100"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                Nombre completo *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, name: e.target.value }))
                                }
                                placeholder="Ej: María López"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, email: e.target.value }))
                                }
                                placeholder="maria@aimaaromas.com"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                Contraseña *
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={form.password}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, password: e.target.value }))
                                }
                                placeholder="Mínimo 6 caracteres"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                Rol *
                            </label>
                            <select
                                value={form.role}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        role: e.target.value as "CEO" | "GERENTA",
                                    }))
                                }
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                            >
                                <option value="GERENTA">Gerenta</option>
                                <option value="CEO">CEO</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-2.5">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="px-4 py-2 rounded-full text-xs font-medium text-text-secondary hover:bg-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-4 py-2 text-xs font-medium hover:opacity-90 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Check className="w-3.5 h-3.5" />
                            )}
                            {saving ? "Creando..." : "Crear usuario"}
                        </button>
                    </div>
                </form>
            )}

            {/* Mensaje de éxito */}
            {success && (
                <div className="bg-green-50 border border-green-100 text-green-700 text-xs rounded-xl px-4 py-2.5">
                    {success}
                </div>
            )}

            {/* Lista de usuarios */}
            {loading ? (
                <div className="text-center py-4 text-text-secondary text-sm">
                    Cargando usuarios...
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-4 text-text-secondary text-sm">
                    No hay usuarios
                </div>
            ) : (
                <div className="space-y-2">
                    {users.map((user) => (
                        <div
                            key={user.id_user}
                            className={`flex items-center gap-4 p-3 rounded-2xl border transition-colors ${user.active === 1
                                    ? "bg-white border-gray-100"
                                    : "bg-gray-50 border-gray-100 opacity-60"
                                }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${user.role === "CEO" ? "bg-accent-pink" : "bg-accent-purple"
                                    }`}
                            >
                                {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-text-primary">
                                        {user.name}
                                    </p>
                                    <span
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${user.role === "CEO"
                                                ? "bg-accent-pink/10 text-accent-pink"
                                                : "bg-accent-purple/10 text-accent-purple"
                                            }`}
                                    >
                                        {user.role === "CEO" ? "CEO" : "Gerenta"}
                                    </span>
                                    {user.active === 0 && (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                            Inactivo
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-text-secondary truncate">
                                    {user.email}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openEditModal(user)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-text-primary hover:bg-gray-200 transition-colors"
                                >
                                    <Pencil className="w-3 h-3" />
                                    Editar
                                </button>

                                <button
                                    onClick={() => toggleActive(user)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${user.active === 1
                                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                                            : "bg-green-50 text-green-600 hover:bg-green-100"
                                        }`}
                                >
                                    {user.active === 1 ? (
                                        <>
                                            <PowerOff className="w-3 h-3" />
                                            Desactivar
                                        </>
                                    ) : (
                                        <>
                                            <Power className="w-3 h-3" />
                                            Reactivar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de edición */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-popup border border-gray-100 max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-text-primary">
                                Editar usuario
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                            >
                                <X className="w-4 h-4 text-text-secondary" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                    Nombre completo
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) =>
                                        setEditForm((p) => ({ ...p, name: e.target.value }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.email}
                                    onChange={(e) =>
                                        setEditForm((p) => ({ ...p, email: e.target.value }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                    Rol
                                </label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) =>
                                        setEditForm((p) => ({
                                            ...p,
                                            role: e.target.value as "CEO" | "GERENTA",
                                        }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                                >
                                    <option value="GERENTA">Gerenta</option>
                                    <option value="CEO">CEO</option>
                                </select>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                    Nueva contraseña (dejar vacío para no cambiar)
                                </label>
                                <input
                                    type="password"
                                    value={editForm.newPassword}
                                    onChange={(e) =>
                                        setEditForm((p) => ({
                                            ...p,
                                            newPassword: e.target.value,
                                        }))
                                    }
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                                />
                            </div>

                            {editError && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-2.5">
                                    {editError}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 rounded-full text-xs font-medium text-text-secondary hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={editingSaving}
                                    className="flex items-center gap-2 bg-gradient-main text-white rounded-full px-4 py-2 text-xs font-medium hover:opacity-90 disabled:opacity-50"
                                >
                                    {editingSaving ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Save className="w-3.5 h-3.5" />
                                    )}
                                    {editingSaving ? "Guardando..." : "Guardar cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}