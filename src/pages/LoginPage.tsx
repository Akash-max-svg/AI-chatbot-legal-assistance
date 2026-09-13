import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Scale, AlertCircle, Shield, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const REMEMBER_KEY = 'legalai_remember_email';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    const { error: err } = await login(email.trim(), password);
    setLoading(false);

    if (err) {
      setError(
        err.toLowerCase().includes('invalid login credentials') || err.toLowerCase().includes('invalid credentials')
          ? 'Invalid email or password. Please check your credentials and try again.'
          : err
      );
      return;
    }

    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, email.trim());
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4 py-12 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -right-60 w-96 h-96 bg-gold-500/4 rounded-full blur-3xl" />
        <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-gold-500/4 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-gold-500/30">
            <Scale size={30} className="text-navy-950" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-gradient-gold">AI Legal Assistant</h1>
          <p className="text-sm text-gray-400 mt-1.5">Indian E-Courts Intelligence Platform</p>
        </div>

        {/* Login card */}
        <div className="bg-navy-900/90 border border-navy-700/50 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {/* Security indicator */}
          <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-navy-700/40">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Shield size={15} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400">Secure JWT Authentication</p>
              <p className="text-[10px] text-gray-500 mt-0.5">bcrypt password hashing · Rate-limited · Encrypted session</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-gray-400 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field w-full"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-medium text-gray-400">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-gold-400 hover:text-gold-300 font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock size={14} className="text-gray-500" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field w-full pl-9 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <span
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((v) => !v)}
                className={`flex-shrink-0 flex items-center justify-center rounded transition-all cursor-pointer border ${
                  rememberMe
                    ? 'bg-gold-500 border-gold-500'
                    : 'bg-navy-800 border-navy-600 group-hover:border-gold-500/50'
                }`}
                style={{ width: 17, height: 17 }}
              >
                {rememberMe && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3 5.5L8 1" stroke="#0a103f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                Remember me on this device
              </span>
            </label>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-navy-950/40 border-t-navy-950 rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Login to Portal
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-navy-700/40 text-center">
            <p className="text-xs text-gray-400">
              New to the platform?{' '}
              <Link to="/register" className="text-gold-400 hover:text-gold-300 font-semibold transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-5">
          Secured by JWT · bcrypt · Rate Limited
        </p>
      </div>
    </div>
  );
}
