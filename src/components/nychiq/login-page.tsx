'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles, Mail, User, Lock, ArrowRight, Eye, EyeOff, Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNychIQStore } from '@/lib/store';

export function LoginPage() {
  const { login, setPage, isLoggedIn } = useNychIQStore();
  const [mode, setMode] = useState<'signup' | 'login'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Guard: redirect to dashboard if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      setPage('app');
    }
  }, [isLoggedIn, setPage]);

  const canSignUp = name.trim() && email.trim() && password.trim().length >= 6;
  const canSignIn = email.trim() && password.trim().length >= 1;

  /* ── Helpers for persisting user identity across sessions ── */
  const saveUserIdentity = (userName: string, userEmail: string) => {
    try {
      localStorage.setItem('nychiq_user_identity', JSON.stringify({ name: userName, email: userEmail }));
    } catch { /* ignore */ }
  };

  const loadUserIdentity = (): { name: string; email: string } | null => {
    try {
      const stored = localStorage.getItem('nychiq_user_identity');
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return null;
  };

  const handleGoogleSignup = async () => {
    if (mode === 'signup' && (!name.trim() || !email.trim())) return;
    if (mode === 'login' && !email.trim()) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (mode === 'signup') {
      // New Google sign-up: use name from form, fallback to email prefix
      const userName = name.trim() || email.split('@')[0];
      saveUserIdentity(userName, email);
      login(userName, email);
    } else {
      // Returning Google login: restore saved name if available
      const saved = loadUserIdentity();
      const savedName = (saved?.email === email.trim()) ? saved.name : null;
      const userName = savedName || email.split('@')[0];
      if (savedName) {
        saveUserIdentity(savedName, email);
      }
      login(userName, email, true); // skipOnboarding for returning users
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && !canSignUp) return;
    if (mode === 'login' && !canSignIn) return;

    setLoading(true);
    // Simulate brief loading
    await new Promise((r) => setTimeout(r, 600));

    if (mode === 'signup') {
      // Save identity for new signups
      saveUserIdentity(name || email.split('@')[0], email);
      login(name || email.split('@')[0], email);
    } else {
      // Returning email login: restore saved name if email matches
      const saved = loadUserIdentity();
      const savedName = (saved?.email === email.trim()) ? saved.name : null;
      const userName = savedName || name || email.split('@')[0];
      if (savedName) {
        saveUserIdentity(savedName, email);
      }
      login(userName, email, true); // skipOnboarding for returning users
    }
  };

  // Don't render login UI if already logged in
  if (isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[rgba(253,186,45,0.15)] blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-[rgba(255,255,255,0.03)] blur-[80px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <button
          onClick={() => setPage('welcome')}
          className="flex items-center justify-center gap-2.5 mb-8 mx-auto group"
        >
          <div className="w-10 h-10 rounded-[5px] bg-[#FDBA2D] flex items-center justify-center shadow-lg shadow-[rgba(253,186,45,0.12)] group-hover:shadow-[rgba(253,186,45,0.12)] transition-shadow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M10 6L18 12L10 18V6Z" fill="white"/>
              <rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="text-xl font-black tracking-[2px] uppercase">NY<span className="text-[#FDBA2D]">CHIQ</span></span>
        </button>

        {/* Card */}
        <div className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] rounded-xl p-6 sm:p-8">
          {/* Tab toggle */}
          <div className="flex items-center bg-[#0a0a0a] rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-[#FDBA2D] text-black shadow-md shadow-[rgba(253,186,45,0.12)]'
                  : 'text-[#666] hover:text-[#a0a0a0]'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-[#FDBA2D] text-black shadow-md shadow-[rgba(253,186,45,0.12)]'
                  : 'text-[#666] hover:text-[#a0a0a0]'
              }`}
            >
              Log In
            </button>
          </div>

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-bold text-[#FFFFFF] text-center mb-1">
                Create Your Account
              </h2>
              <p className="text-sm text-[#666] text-center mb-6">
                Start your YouTube intelligence journey
              </p>

              {/* Google button */}
              <button
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-[#333] rounded-lg text-sm font-medium hover:bg-[#f5f5f5] transition-colors mb-4 disabled:opacity-40"
                onClick={handleGoogleSignup}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[#0f0f0f]" />
                <span className="text-[10px] text-[#444] font-medium tracking-wider uppercase">OR</span>
                <div className="flex-1 h-px bg-[#0f0f0f]" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-xs text-[#666] font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                    <Input
                      id="signup-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="pl-9 bg-[#0a0a0a] border-[rgba(255,255,255,0.03)] text-[#FFFFFF] placeholder-[#444] h-11 focus:border-[#FDBA2D55]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs text-[#666] font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9 bg-[#0a0a0a] border-[rgba(255,255,255,0.03)] text-[#FFFFFF] placeholder-[#444] h-11 focus:border-[#FDBA2D55]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs text-[#666] font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                    <Input
                      id="signup-password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="pl-9 pr-9 bg-[#0a0a0a] border-[rgba(255,255,255,0.03)] text-[#FFFFFF] placeholder-[#444] h-11 focus:border-[#FDBA2D55]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#a0a0a0] transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={!canSignUp || loading}
                  className="w-full bg-[#FDBA2D] text-black hover:bg-[#C69320] font-semibold h-11 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[rgba(253,186,45,0.12)]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <>
                      CREATE ACCOUNT
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Terms */}
              <p className="text-[11px] text-[#444] text-center mt-4 leading-relaxed">
                By creating an account, you agree to our{' '}
                <button onClick={() => setPage('terms')} className="text-[#666] hover:text-[#FDBA2D] transition-colors underline underline-offset-2">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button onClick={() => setPage('privacy')} className="text-[#666] hover:text-[#FDBA2D] transition-colors underline underline-offset-2">
                  Privacy Policy
                </button>
              </p>
            </div>
          )}

          {/* Log In Form */}
          {mode === 'login' && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-bold text-[#FFFFFF] text-center mb-1">
                Welcome Back
              </h2>
              <p className="text-sm text-[#666] text-center mb-6">
                Sign in to your NychIQ account
              </p>

              {/* Google button */}
              <button
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-[#333] rounded-lg text-sm font-medium hover:bg-[#f5f5f5] transition-colors mb-4 disabled:opacity-40"
                onClick={handleGoogleSignup}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[#0f0f0f]" />
                <span className="text-[10px] text-[#444] font-medium tracking-wider uppercase">OR</span>
                <div className="flex-1 h-px bg-[#0f0f0f]" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs text-[#666] font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9 bg-[#0a0a0a] border-[rgba(255,255,255,0.03)] text-[#FFFFFF] placeholder-[#444] h-11 focus:border-[#FDBA2D55]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-xs text-[#666] font-medium">Password</Label>
                    <button type="button" className="text-[11px] text-[#FDBA2D] hover:text-[#FDBA2D] transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                    <Input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-9 pr-9 bg-[#0a0a0a] border-[rgba(255,255,255,0.03)] text-[#FFFFFF] placeholder-[#444] h-11 focus:border-[#FDBA2D55]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#a0a0a0] transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={!canSignIn || loading}
                  className="w-full bg-[#FDBA2D] text-black hover:bg-[#C69320] font-semibold h-11 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[rgba(253,186,45,0.12)]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <>
                      SIGN IN
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Footer link */}
              <p className="text-center mt-5 text-sm text-[#555]">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-[#FDBA2D] hover:text-[#FDBA2D] font-medium transition-colors"
                >
                  Sign up free
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Back link */}
        <button
          onClick={() => setPage('welcome')}
          className="mt-6 text-xs text-[#444] hover:text-[#a0a0a0] transition-colors mx-auto block flex items-center gap-1"
        >
          <ArrowRight className="w-3 h-3 rotate-180" />
          Back to home
        </button>
      </div>
    </div>
  );
}
