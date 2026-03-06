import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { AnalyticsChart, LightningBolt } from './Icons';

export function LoginPage() {
    const { signIn, signUp } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!email || !password) {
            setError('Preencha todos os campos.');
            return;
        }

        if (isSignUp && password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (isSignUp && password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        if (isSignUp) {
            const { error } = await signUp(email, password);
            if (error) {
                setError(error);
            } else {
                setSuccess('Conta criada! Verifique seu email para confirmar o cadastro.');
                setIsSignUp(false);
                setPassword('');
                setConfirmPassword('');
            }
        } else {
            const { error } = await signIn(email, password);
            if (error) {
                setError(error);
            }
        }

        setLoading(false);
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError(null);
        setSuccess(null);
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="min-h-screen bg-[#060a14] relative overflow-hidden font-sans text-slate-100 flex items-center justify-center p-4">
            {/* Background mesh */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),transparent)]" />
                <div className="mesh-bg bg-emerald-600 top-[-20%] left-[-15%]" />
                <div className="mesh-bg bg-cyan-700 bottom-[-25%] right-[-15%]" />
                <div className="mesh-bg bg-teal-800 top-[40%] left-[50%]" style={{ width: '35vw', height: '35vw' }} />
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1.2 }}
                className="w-full max-w-md relative"
            >
                {/* Glow behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 via-cyan-600/10 to-teal-600/20 rounded-3xl blur-xl opacity-60" />

                {/* Card */}
                <div className="relative glass-dark rounded-2xl p-8 sm:p-10">
                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                        className="flex flex-col items-center mb-8"
                    >
                        <img
                            src={`${import.meta.env.BASE_URL}assets/logo.png`}
                            alt="CAIO Consultoria Esportiva"
                            className="h-28 sm:h-36 w-auto object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        />
                    </motion.div>

                    {/* Title */}
                    <AnimatePresence mode="wait">
                        <motion.h2
                            key={isSignUp ? 'signup' : 'login'}
                            initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
                            transition={{ duration: 0.2 }}
                            className="text-lg font-bold text-slate-200 text-center mb-6"
                        >
                            {isSignUp ? 'Criar Conta' : 'Acessar Painel'}
                        </motion.h2>
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="email" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    autoComplete="email"
                                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:bg-slate-800/80 transition-all duration-300"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Senha
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:bg-slate-800/80 transition-all duration-300"
                                />
                            </div>

                            <AnimatePresence>
                                {isSignUp && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                            Confirmar Senha
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:bg-slate-800/80 transition-all duration-300"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Error / Success */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 px-4 py-2.5 rounded-xl border border-rose-500/20"
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span>{error}</span>
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-4 py-2.5 rounded-xl border border-emerald-500/20"
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>{success}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl py-3.5 text-sm font-bold shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-500 border border-emerald-400/15 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-4 h-4 rounded-full border-2 border-white border-t-transparent"
                                    />
                                    <span>Processando...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <LightningBolt size={16} className="text-emerald-200" />
                                    <span>{isSignUp ? 'Criar Conta' : 'Entrar'}</span>
                                </div>
                            )}
                        </motion.button>
                    </form>

                    {/* Toggle mode */}
                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-xs text-slate-500 hover:text-emerald-400 transition-colors duration-300"
                        >
                            {isSignUp ? (
                                <>Já tem conta? <span className="text-emerald-500 font-semibold">Fazer login</span></>
                            ) : (
                                <>Não tem conta? <span className="text-emerald-500 font-semibold">Criar conta</span></>
                            )}
                        </button>
                    </div>

                    {/* Footer inside card */}
                    <div className="mt-8 pt-5 border-t border-slate-700/30 flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                        <span className="text-[9px] text-slate-700 font-medium tracking-[0.2em] uppercase">Conexão segura via Supabase</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
