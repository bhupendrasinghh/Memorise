'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Mail, Lock, User as UserIcon, Sparkles, ArrowRight, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'reset';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register, resetPassword, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      if (mode === 'login') {
        const ok = await login(cleanEmail, cleanPassword);
        if (ok) onClose();
      } else if (mode === 'register') {
        const ok = await register(name.trim(), cleanEmail, cleanPassword);
        if (ok) onClose();
      } else {
        const ok = await resetPassword(cleanEmail, cleanPassword);
        if (ok) onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async () => {
    setIsSubmitting(true);
    try {
      const ok = await loginAsDemo();
      if (ok) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            {mode === 'reset' ? <KeyRound className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create an Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {mode === 'login' && 'Sign in to access your notes, revisions, and task schedules'}
            {mode === 'register' && 'Join Memorise to start your spaced repetition journey'}
            {mode === 'reset' && 'Enter your registered email and choose a new password'}
          </p>
        </div>

        {/* Demo Account Quick Access Button (only on login mode) */}
        {mode === 'login' && (
          <>
            <button
              onClick={handleDemoClick}
              disabled={isSubmitting}
              className="w-full mb-5 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-pink-500/20 border border-indigo-500/30 dark:border-indigo-400/30 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 text-left">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Instant Demo Login</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">demo@memorise.app • password123</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 transform group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="relative flex py-2 items-center mb-5">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-400 uppercase font-medium">Or continue with email</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {mode === 'reset' ? 'New Password (min 6 chars)' : 'Password'}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In'
              : mode === 'register'
              ? 'Create Account'
              : 'Update Password & Sign In'}
          </button>
        </form>

        <div className="text-center mt-5 space-y-2">
          {mode === 'reset' ? (
            <button
              onClick={() => setMode('login')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              ← Back to Sign in
            </button>
          ) : (
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
