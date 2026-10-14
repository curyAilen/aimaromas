import { SettingsForm } from "@/components/features/configuracion/SettingsForm";
import { MyProfile } from "@/components/features/configuracion/MyProfile";
import { UsersManager } from "@/components/features/configuracion/UsersManager";
import { getSession } from "@/lib/auth";

export default async function ConfiguracionPage() {
    const session = await getSession();
    const isCEO = session?.role === "CEO";

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">
                    Configuración
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                    Ajustes generales del sistema
                </p>
            </div>

            {/* Mi perfil (visible para todos) */}
            <MyProfile />

            {/* Configuración general (solo CEO) */}
            {isCEO && <SettingsForm />}

            {/* Gestión de usuarios (solo CEO) */}
            {isCEO && <UsersManager />}
        </div>
    );
}