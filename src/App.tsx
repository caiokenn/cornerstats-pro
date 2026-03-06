/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DatePicker } from './components/DatePicker';
import { MatchCard } from './components/MatchCard';
import { fetchMatchesByDate, ESPNMatch } from './services/espn';
import { LightningBolt, Trophy, WarningCircle, SyncIcon, LivePulse, AnalyticsChart } from './components/Icons';
import { isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [matches, setMatches] = useState<ESPNMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isMounted = true;

    const loadMatches = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      setError(null);
      try {
        const data = await fetchMatchesByDate(selectedDate);
        if (isMounted) {
          setMatches(data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!isBackground && isMounted) setError('Não foi possível carregar os jogos. Tente novamente mais tarde.');
      } finally {
        if (!isBackground && isMounted) setLoading(false);
      }
    };

    loadMatches();

    if (isSameDay(selectedDate, new Date())) {
      intervalId = setInterval(() => {
        loadMatches(true);
      }, 15000);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-[#060a14] relative overflow-hidden font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-100">
      {/* Dark Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.06),transparent)]" />
        <div className="mesh-bg bg-emerald-600 top-[-20%] left-[-15%]" />
        <div className="mesh-bg bg-cyan-700 bottom-[-25%] right-[-15%]" />
        <div className="mesh-bg bg-teal-800 top-[40%] left-[50%]" style={{ width: '35vw', height: '35vw' }} />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1.2 }}
        className="sticky top-0 z-50 bg-[#060a14]/85 backdrop-blur-2xl border-b border-slate-800/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-[72px] flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-xl opacity-25 group-hover:opacity-50 transition-opacity duration-700" />
              <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-2 sm:p-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] group-hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] transition-all duration-700 border border-emerald-400/15">
                <AnalyticsChart size={20} className="text-white" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg sm:text-[22px] font-black text-white tracking-[-0.02em] leading-none">
                Corner<span className="text-gradient-neon">Stats</span>
              </h1>
              <p className="text-[8px] sm:text-[9px] text-slate-600 font-bold tracking-[0.3em] uppercase mt-[1px]">Premium Analytics</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {lastUpdated && (
              <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 font-medium tabular-nums">
                <div className="relative flex items-center justify-center w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </div>
                <SyncIcon size={11} className="text-slate-600" />
                <span>{lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all duration-500 border border-emerald-400/15"
            >
              <LivePulse size={13} className="text-emerald-200" />
              <span>Pro</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-0">
        <DatePicker selectedDate={selectedDate} onChange={setSelectedDate} />

        <div className="space-y-3.5 sm:space-y-5">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-24 sm:py-32 gap-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500/10" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-emerald-500 border-t-transparent border-r-transparent shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-1.5 rounded-full border-2 border-cyan-400 border-b-transparent border-l-transparent opacity-50"
                  />
                </div>
                <p className="text-slate-500 font-medium tracking-wide text-xs sm:text-sm">Escaneando oportunidades...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4"
              >
                <div className="bg-rose-500/10 p-3.5 sm:p-4 rounded-2xl mb-4 border border-rose-500/20">
                  <WarningCircle size={36} className="text-rose-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-200 mb-2">Falha na Conexão</h3>
                <p className="text-slate-500 mb-6 max-w-md text-xs sm:text-sm">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500 transition-all text-sm"
                >
                  <SyncIcon size={15} />
                  Reconectar
                </motion.button>
              </motion.div>
            ) : matches.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4 glass-dark rounded-2xl mx-auto max-w-2xl"
              >
                <div className="bg-slate-700/50 p-4 sm:p-5 rounded-2xl mb-5 border border-slate-600/30">
                  <Trophy size={36} className="text-slate-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-300 mb-2 tracking-tight">Sem jogos detectados</h3>
                <p className="text-slate-500 max-w-md text-xs sm:text-sm leading-relaxed">
                  O radar não encontrou partidas com dados suficientes para esta data.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.05 } }
                }}
                className="grid gap-3 sm:gap-4"
              >
                {/* Section header */}
                <div className="flex items-center justify-between mb-1 px-0.5 sm:px-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-200 flex items-center gap-2 tracking-tight">
                    <div className="relative flex items-center justify-center w-2.5 h-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>
                    Radar Live
                    <span className="text-xs sm:text-sm font-medium text-slate-600 ml-0.5">({matches.length})</span>
                  </h2>
                  <span className="text-[9px] sm:text-[10px] text-emerald-500/80 uppercase tracking-[0.12em] font-bold bg-emerald-500/8 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-emerald-500/10 flex items-center gap-1.5">
                    <LivePulse size={10} className="text-emerald-500" />
                    <span className="hidden xs:inline">Tempo real</span>
                    <span className="xs:hidden">Live</span>
                  </span>
                </div>
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/40 mt-8 sm:mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <AnalyticsChart size={13} className="text-emerald-600" />
            <span className="text-[10px] sm:text-xs text-slate-700 font-medium">CornerStats Pro © {new Date().getFullYear()}</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-800 font-medium tracking-[0.15em] uppercase">Powered by AI Analytics Engine</span>
        </div>
      </footer>
    </div>
  );
}
