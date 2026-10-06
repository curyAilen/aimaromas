"use client";

import { useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface DayData {
    date: string;
    label: string;
    workspaces: number;
    dayNew: number;
    hasActivity: boolean;
}

const mockDays: DayData[] = [
    { date: "2025-08-12", label: "12 Aug", workspaces: 2, dayNew: 1, hasActivity: true },
    { date: "2025-08-13", label: "13 Aug", workspaces: 3, dayNew: 0, hasActivity: true },
    { date: "2025-08-14", label: "14 Aug", workspaces: 2, dayNew: 1, hasActivity: true },
    { date: "2025-08-15", label: "15 Aug", workspaces: 4, dayNew: 2, hasActivity: true },
    { date: "2025-08-16", label: "16 Aug", workspaces: 3, dayNew: 0, hasActivity: false },
    { date: "2025-08-17", label: "17 Aug", workspaces: 5, dayNew: 1, hasActivity: true },
    { date: "2025-08-18", label: "18 Aug", workspaces: 4, dayNew: 0, hasActivity: false },
    { date: "2025-08-19", label: "19 Aug", workspaces: 6, dayNew: 2, hasActivity: true },
    { date: "2025-08-20", label: "20 Aug", workspaces: 5, dayNew: 1, hasActivity: true },
    { date: "2025-08-21", label: "21 Aug", workspaces: 3, dayNew: 0, hasActivity: true },
    { date: "2025-08-22", label: "22 Aug", workspaces: 7, dayNew: 3, hasActivity: true },
    { date: "2025-08-23", label: "23 Aug", workspaces: 6, dayNew: 1, hasActivity: true },
    { date: "2025-08-24", label: "24 Aug", workspaces: 8, dayNew: 2, hasActivity: true },
    { date: "2025-08-25", label: "25 Aug", workspaces: 7, dayNew: 1, hasActivity: false },
    { date: "2025-08-26", label: "26 Aug", workspaces: 9, dayNew: 3, hasActivity: true },
    { date: "2025-08-27", label: "27 Aug", workspaces: 8, dayNew: 0, hasActivity: false },
    { date: "2025-08-28", label: "28 Aug", workspaces: 10, dayNew: 2, hasActivity: true },
    { date: "2025-08-29", label: "29 Aug", workspaces: 9, dayNew: 1, hasActivity: true },
    { date: "2025-08-30", label: "30 Aug", workspaces: 11, dayNew: 2, hasActivity: true },
    { date: "2025-09-01", label: "1 Sep", workspaces: 12, dayNew: 1, hasActivity: true },
    { date: "2025-09-02", label: "2 Sep", workspaces: 10, dayNew: 0, hasActivity: true },
    { date: "2025-09-03", label: "3 Sep", workspaces: 11, dayNew: 1, hasActivity: true },
];

export function DotGrid() {
    return (
        <div className="space-y-4">
            {/* Grid de puntos */}
            <div className="grid grid-cols-11 gap-x-2 gap-y-3">
                {mockDays.map((day) => (
                    <Tooltip
                        key={day.date}
                        content={
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-text-primary">
                                    {day.label} performance
                                </p>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-text-secondary">Workspaces:</span>
                                    <span className="text-accent-orange font-semibold">
                                        {day.workspaces}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-text-secondary">Day's new:</span>
                                    <span className="font-semibold text-text-primary">
                                        +{day.dayNew}
                                    </span>
                                </div>
                            </div>
                        }
                    >
                        <button
                            className={cn(
                                "w-4 h-4 rounded-full transition-all hover:scale-125",
                                day.hasActivity
                                    ? "bg-gradient-to-br from-accent-pink to-accent-purple shadow-sm"
                                    : "border-2 border-dashed border-gray-300"
                            )}
                            aria-label={`${day.label}: ${day.workspaces} workspaces`}
                        />
                    </Tooltip>
                ))}
            </div>

            {/* Eje X con fechas */}
            <div className="flex justify-between text-[10px] text-text-secondary px-1">
                <span>12 Aug</span>
                <span>14 Aug</span>
                <span>16 Aug</span>
                <span>18 Aug</span>
                <span>20 Aug</span>
                <span>22 Aug</span>
                <span>24 Aug</span>
                <span>26 Aug</span>
                <span>28 Aug</span>
                <span>30 Aug</span>
                <span>1 Sep</span>
            </div>
        </div>
    );
}