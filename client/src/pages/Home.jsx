import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getMe } from '@/lib/api';

export default function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    getMe()
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => setChecking(false));
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg">
            R
          </div>
          <span className="text-xl font-semibold tracking-tight">ResumeCurator</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-8">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            AI-Powered Resume Optimization
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
            Build a resume that{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              beats the ATS
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
            Create, optimize, and export pixel-perfect resumes scored by AI.
            Get instant keyword analysis and smart bullet rewrites tailored to
            every job description.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              id="google-sign-in"
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/30 hover:scale-[1.02] cursor-pointer"
              onClick={() => {
                window.location.href = 'http://localhost:5000/api/auth/google';
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            {[
              {
                icon: '📊',
                title: 'ATS Score',
                desc: 'Real-time scoring across 8 criteria',
              },
              {
                icon: '🔑',
                title: 'Keyword Match',
                desc: 'Gap analysis vs job description',
              },
              {
                icon: '✨',
                title: 'AI Rewrite',
                desc: 'One-click bullet optimization',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-left hover:bg-white/[0.08] transition-colors"
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 py-6">
        Powered by Claude AI · Built with React & Tailwind
      </footer>
    </div>
  );
}
