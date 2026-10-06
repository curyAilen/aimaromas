"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (visible && ref.current) {
            ref.current.focus();
        }
    }, [visible]);

    return (
        <div
            className={cn("relative inline-block", className)}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}

            {visible && (
                <div
                    ref={ref}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 transition-all duration-200"
                >
                    <div className="relative bg-white rounded-2xl shadow-popup border border-gray-100/80 p-4 min-w-[220px]">
                        {content}
                        {/* Colita del tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="w-3 h-3 bg-white border-r border-b border-gray-100/80 rotate-45" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}