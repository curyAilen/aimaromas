import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const range = searchParams.get("range") || "month";

        // Traer todos los clientes con cumpleaños cargado
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id_client, name, phone, email, birthday, notes
       FROM clients
       WHERE birthday IS NOT NULL
       ORDER BY name ASC`
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentYear = today.getFullYear();

        const filtered = rows
            .map((client) => {
                const bday = new Date(client.birthday);
                // Calcular próxima fecha de cumpleaños
                const nextBday = new Date(
                    currentYear,
                    bday.getMonth(),
                    bday.getDate()
                );
                if (nextBday < today) {
                    nextBday.setFullYear(currentYear + 1);
                }

                const daysUntil = Math.ceil(
                    (nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );

                const isToday =
                    bday.getMonth() === today.getMonth() &&
                    bday.getDate() === today.getDate();

                return {
                    id_client: client.id_client,
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    birthday: client.birthday,
                    notes: client.notes,
                    next_birthday: nextBday.toISOString().slice(0, 10),
                    days_until: daysUntil,
                    is_today: isToday,
                    age: nextBday.getFullYear() - bday.getFullYear(),
                };
            })
            .filter((client) => {
                if (range === "today") return client.is_today;
                if (range === "7days") return client.days_until <= 7;
                if (range === "30days") return client.days_until <= 30;
                if (range === "month") {
                    return (
                        new Date(client.next_birthday).getMonth() === today.getMonth()
                    );
                }
                return true; // "all"
            })
            .sort((a, b) => {
                if (a.is_today && !b.is_today) return -1;
                if (!a.is_today && b.is_today) return 1;
                return a.days_until - b.days_until;
            });

        // Leer settings de cumpleaños
        const [settingsRows] = await pool.query<RowDataPacket[]>(
            `SELECT setting_key, setting_value FROM settings 
       WHERE setting_key LIKE 'birthday%'`
        );
        const settings: Record<string, string> = {};
        for (const row of settingsRows) {
            settings[row.setting_key] = row.setting_value;
        }

        return NextResponse.json({
            clients: filtered,
            settings,
            total: filtered.length,
        });
    } catch (error) {
        console.error("Error en GET /api/birthdays:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}