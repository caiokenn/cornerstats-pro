import React from 'react';
import { motion } from 'motion/react';

interface CaioLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'vertical' | 'horizontal';
    animated?: boolean;
}

export function CaioLogo({ className = '', size = 'md', variant = 'vertical', animated = true }: CaioLogoProps) {
    const dimensions = {
        sm: { star: '10px', hex: '36px', title: '20px', sub: '6px', gap: 'gap-3' },
        md: { star: '14px', hex: '52px', title: '28px', sub: '8px', gap: 'gap-4' },
        lg: { star: '20px', hex: '80px', title: '42px', sub: '12px', gap: 'gap-5' },
        xl: { star: '26px', hex: '100px', title: '54px', sub: '16px', gap: 'gap-6' },
    }[size];

    const symbol = (
        <div className="flex flex-col items-center">
            {/* Star */}
            <svg
                viewBox="0 0 24 24"
                style={{ width: dimensions.star, height: dimensions.star }}
                className="text-[#D4B856] fill-current drop-shadow-[0_0_8px_rgba(212,184,86,0.6)] mb-0.5"
            >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>

            {/* Hexagon & Check */}
            <div
                className="relative flex items-center justify-center drop-shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                style={{ width: dimensions.hex, height: dimensions.hex }}
            >
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    {/* Hexagon Base */}
                    <path d="M50 2 L93 25 L93 75 L50 98 L7 75 L7 25 Z" fill="#1B2A4A" className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]" />

                    {/* Inner Light Shape */}
                    <circle cx="50" cy="50" r="36" fill="#F8FAFC" />

                    {/* Checkmark 3D shadow/depth */}
                    <path d="M30 52 L45 67 L75 37" stroke="#059669" strokeWidth="15" strokeLinecap="square" strokeLinejoin="miter" fill="none" />

                    {/* Checkmark main vibrant green */}
                    <path d="M30 48 L45 63 L75 33" stroke="#10B981" strokeWidth="15" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
                </svg>
            </div>
        </div>
    );

    const text = (
        <div className={`flex flex-col ${variant === 'horizontal' ? 'justify-center items-start' : 'items-center mt-3'} w-full`}>
            <h1
                className="font-black text-slate-100 tracking-[-0.01em] leading-none text-shadow-sm"
                style={{ fontSize: dimensions.title }}
            >
                CAIO
            </h1>
            <p
                className="text-[#94a3b8] font-bold tracking-[0.16em] uppercase whitespace-nowrap opacity-90"
                style={{ fontSize: dimensions.sub, marginTop: variant === 'horizontal' ? '3px' : '6px' }}
            >
                Consultoria Esportiva
            </p>
        </div>
    );

    const containerClass = `flex ${variant === 'horizontal' ? `flex-row items-center ${dimensions.gap}` : 'flex-col items-center justify-center'} ${className}`;

    if (animated) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className={containerClass}
            >
                {symbol}
                {text}
            </motion.div>
        );
    }

    return (
        <div className={containerClass}>
            {symbol}
            {text}
        </div>
    );
}
