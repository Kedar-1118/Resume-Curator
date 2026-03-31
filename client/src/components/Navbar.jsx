import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getMe, logout, createResume } from '@/lib/api';
import { toast } from 'sonner';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {});
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
    } catch {
      // Cookie may already be cleared
    }
    navigate('/', { replace: true });
  };

  const handleQuickCreate = async () => {
    setCreating(true);
    try {
      const newResume = await createResume({ title: 'Untitled Resume' });
      toast.success('Resume created!');
      navigate(`/builder/${newResume._id}`);
    } catch {
      toast.error('Failed to create resume');
    } finally {
      setCreating(false);
    }
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      {/* Left: Logo + navlinks */}
      <div className="flex items-center gap-5">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-indigo-500/20">
            R
          </div>
          <span className="text-base font-semibold tracking-tight text-white hidden sm:inline">
            ResumeCurator
          </span>
        </Link>

        <div className="h-5 w-px bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-1">
          <Link to="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-8 cursor-pointer transition-colors ${
                isActive('/dashboard')
                  ? 'text-white bg-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📁 Dashboard
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickCreate}
            disabled={creating}
            className="text-xs h-8 text-slate-400 hover:text-white cursor-pointer"
          >
            {creating ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin h-3 w-3 border border-slate-400 border-t-transparent rounded-full" />
                Creating...
              </span>
            ) : (
              '+ New Resume'
            )}
          </Button>

          <Link to="/updater">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-8 cursor-pointer transition-colors ${
                isActive('/updater')
                  ? 'text-white bg-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✨ Improve Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Right: User avatar dropdown */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer rounded-full"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-full ring-2 ring-white/10 hover:ring-indigo-500/40 transition-all"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-slate-900 border border-white/10 shadow-2xl shadow-black/40 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/dashboard');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                  >
                    📁 Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    🚪 Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
