"use client";

import { useEffect, useState } from "react";
import { User, Save, Loader2, Lock, Check, X } from "lucide-react";

export function MyProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [user, setUser] = useState<{
        id_user: number;
        name: string;
        email: string;
        role: string;
    } | null>(null);

    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState("");

    const [changePassword, setChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    async function loadProfile() {
        try {
            const res = await fetch("/api/users/me");
            const data = await res.json();
            if (res.ok) {
                setUser(data.user);
                setName(data.user.name);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Verificar cambio de contraseña
        if (changePassword) {
            if (!currentPassword || !newPassword) {
                setError("Completá todos los campos de contraseña");
                return;
            }
            if (newPassword !== confirmPassword) {
                setError("Las contraseñas nuevas no coinciden");
                return;
            }
            if (newPassword.length < 6) {
                setError("La nueva contraseña debe tener al menos 6 caracteres");
                return;
            }
        }

        setSaving(true);

        try {
            const res = await fetch("/api/users/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim() !== user?.name ? name : undefined,
                    currentPassword: changePassword ? currentPassword : undefined,
                    newPassword: changePassword ? newPassword : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al guardar");
                setSaving(false);
                return;
            }

            setSuccess("✅ Perfil actualizado correctamente");
            setEditMode(false);
            setChangePassword(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            await loadProfile();
            setTimeout(() => setSuccess(""), 3000);
        } catch {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        setName(user?.name || "");
        setEditMode(false);
        setChangePassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");
    }

    if (loading) {
        return (
            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 text-center text-text-secondary text-sm">
                Cargando perfil...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 text-center text-text-secondary text-sm">
                No se pudo cargar el perfil
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-card border border-gray-100/50 p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center">
                        <User className="w-5 h-5 text-accent-pink" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-text-primary">
                            Mi perfil
                        </h2>
                        <p className="text-xs text-text-secondary">
                            {user.role === "CEO" ? "CEO" : "Gerenta"} · {user.email}
                        </p>
                    </div>
                </div>
                {!editMode && (
                    <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-text-primary rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Editar perfil
                    </button>
                )}
            </div>

            {success && (
                <div className="bg-green-50 border border-green-100 text-green-700 text-xs rounded-xl px-4 py-2.5">
                    {success}
                </div>
            )}

            {!editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-text-secondary">Nombre</p>
                        <p className="text-sm font-medium text-text-primary">
                            {user.name}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Email</p>
                        <p className="text-sm font-medium text-text-primary">
                            {user.email}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Rol</p>
                        <p className="text-sm font-medium text-text-primary">
                            {user.role === "CEO" ? "CEO" : "Gerenta"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary">Contraseña</p>
                        <p className="text-sm font-medium text-text-primary">
                            ••••••••
                        </p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-5">
                    {/* Nombre */}
                    <div>
                        <label className="text-xs font-medium text-text-secondary block mb-1.5">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                        />
                    </div>

                    {/* Cambio de contraseña */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-text-secondary" />
                                <p className="text-sm font-medium text-text-primary">
                                    Cambiar contraseña
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setChangePassword(!changePassword)}
                                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${changePassword
                                        ? "bg-gray-100 text-text-secondary hover:bg-gray-200"
                                        : "bg-accent-pink text-white hover:opacity-90"
                                    }`}
                            >
                                {changePassword ? "Cancelar cambio" : "Cambiar"}
                            </button>
                        </div>

                        {changePassword && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                        Contraseña actual
                                    </label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                            Nueva contraseña
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text-secondary block mb-1.5">
                                            Confirmar contraseña
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent-pink/50"
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-2.5">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-5 py-2.5 rounded-full text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
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
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}