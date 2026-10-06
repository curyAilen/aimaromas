"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "ghost" | "outline";
    size?: "sm" | "md" | "lg";
}

export function Button({
    children,
    className,
    variant = "primary",
    size = "md",
    ...props
}: ButtonProps) {
    const variants = {
        primary:
            "bg-gradient-main text-white hover:opacity-90 shadow-md shadow-accent-pink/20",
        ghost: "bg-transparent text-text-primary hover:bg-gray-100",
        outline:
            "bg-white border border-gray-200 text-text-primary hover:bg-gray-50",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <button
            className={cn(
                "rounded-full font-medium transition-all duration-200 active:scale-95",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}