/**
 * Valores por defecto de la configuración. Son el ÚNICO lugar del código con
 * estos números. Se cargan en la base la primera vez (ver lib/schema.ts) y desde
 * ahí se editan en Admin → Configuración.
 * Este archivo no usa la base de datos, así que también se puede importar desde el navegador.
 */
export const DEFAULT_SETTINGS = {
    free_shipping_threshold: "80000",
    delivery_cost: "5000",
    whatsapp_number: "5491173735090",
    order_notification_email: "cury.ailena@gmail.com",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
