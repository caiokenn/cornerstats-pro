import React from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarIcon } from './Icons';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DatePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export function DatePicker({ selectedDate, onChange }: DatePickerProps) {
  const today = new Date();

  const dates = [
    subDays(selectedDate, 2),
    subDays(selectedDate, 1),
    selectedDate,
    addDays(selectedDate, 1),
    addDays(selectedDate, 2),
  ];

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-5 mb-6 sm:mb-8 relative z-10">
      {/* Date label */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2.5 bg-slate-800/50 backdrop-blur-xl px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-700/30"
      >
        <CalendarIcon size={15} className="text-emerald-500" />
        <span className="text-slate-300 font-semibold text-xs sm:text-base capitalize tracking-tight">
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </span>
      </motion.div>

      {/* Date pills row */}
      <div className="flex items-center gap-1.5 sm:gap-3 w-full max-w-2xl justify-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(subDays(selectedDate, 1))}
          className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/30 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/25 transition-all duration-300 shrink-0"
        >
          <ChevronLeft size={16} />
        </motion.button>

        <div className="flex gap-1.5 sm:gap-3 overflow-x-auto hide-scrollbar py-2 px-0.5">
          {dates.map((date, i) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);

            return (
              <motion.button
                key={i}
                layout
                onClick={() => onChange(date)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: isSelected ? 1.05 : 1,
                  y: isSelected ? -3 : 0,
                }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex flex-col items-center justify-center min-w-[52px] sm:min-w-[72px] py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-lg sm:rounded-xl transition-all border backdrop-blur-xl",
                  isSelected
                    ? "border-emerald-500/40 text-white z-10"
                    : "border-slate-700/30 text-slate-400 hover:border-slate-600/50 bg-slate-800/30"
                )}
              >
                {isSelected && (
                  <>
                    <motion.div
                      layoutId="active-date-bg"
                      className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-b from-emerald-600 to-teal-700 -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                    <motion.div
                      layoutId="active-date-glow"
                      className="absolute -inset-0.5 sm:-inset-1 rounded-xl sm:rounded-2xl bg-emerald-500 blur-xl -z-20 opacity-20"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  </>
                )}
                <span className={cn("text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-0.5 sm:mb-1", isSelected ? "text-emerald-200/80" : "text-slate-500")}>
                  {isToday ? 'Hoje' : format(date, 'EEE', { locale: ptBR })}
                </span>
                <span className={cn("text-lg sm:text-2xl font-extrabold tracking-tighter leading-none", isSelected ? "text-white" : "text-slate-300")}>
                  {format(date, 'dd')}
                </span>
                {isToday && !isSelected && (
                  <div className="absolute bottom-1 sm:bottom-1.5 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                )}
              </motion.button>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(addDays(selectedDate, 1))}
          className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/30 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/25 transition-all duration-300 shrink-0"
        >
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}
