import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    action?: boolean;
    onAction?: () => void;
}

export function Card({ children, className, title, action, onAction }: CardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-3xl p-6 shadow-card border border-gray-100/50",
                className
            )}
        >
            {title && (
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-text-primary">{title}</h3>
                    {action && (
                        <button
                            onClick={onAction}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <ArrowUpRight className="w-4 h-4 text-text-secondary" />
                        </button>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}