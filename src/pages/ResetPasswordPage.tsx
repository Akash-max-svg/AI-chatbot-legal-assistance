import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Scale, Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';

type Stage = 'waiting' | 'form' | 'success' | 'expired';

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

export default function ResetPasswordPage() {
  const [stage, setStage] = useState<Stage>('waiting');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const strength = getPasswordStrength(password);

  useEffect(() => {
    // Check for token in URL
    const token = searchParams.get('token');
    if (token) {
      setStage('form');
    } else {
      setStage('expired');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter them.');
      return;
    }
    if (strength.score < 2) {
      setError('Password is too weak. Add uppercase letters, numbers, or symbols.');
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setStage('success');
      setTimeout(() => navigate('/login', { replace: true }), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
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
          <p className="text-sm text-gray-400 mt-1.5">Create New Password</p>
        </div>

        <div className="bg-navy-900/90 border border-navy-700/50 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {/* Waiting / loading state */}
          {stage === 'waiting' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400">Verifying your reset link...</p>
            </div>
          )}

          {/* Expired / invalid */}
          {stage === 'expired' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={30} className="text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-100 mb-2">Link Expired</h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                This password reset link is invalid or has expired. Reset links are valid for 1 hour only.
              </p>
              <Link to="/forgot-password" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                Request New Reset Link
              </Link>
              <div className="mt-4">
                <Link to="/login" className="text-xs text-gray-500 hover:text-gold-400 transition-colors">
                  Back to Login
                </Link>
              </div>
            </div>
          )}

          {/* Password form */}
          {stage === 'form' && (
            <>
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-navy-700/40">
                <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <KeyRound size={17} className="text-gold-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-100">Create New Password</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Choose a strong password for your account</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* New password */}
                <div>
                  <label htmlFor="new-password" className="block text-xs font-medium text-gray-400 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Lock size={14} className="text-gray-500" />
                    </div>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="input-field w-full pl-9 pr-10"
                      autoComplete="new-password"
                      autoFocus
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

                  {/* Password strength meter */}
                  {password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.score ? strength.color : 'bg-navy-700'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-500">
                          Use uppercase, numbers & symbols for a stronger password
                        </p>
                        {strength.label && (
                          <span className={`text-[10px] font-semibold ${
                            strength.score <= 1 ? 'text-red-400'
                            : strength.score <= 2 ? 'text-amber-400'
                            : strength.score <= 3 ? 'text-blue-400'
                            : 'text-emerald-400'
                          }`}>
                            {strength.label}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-400 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Lock size={14} className="text-gray-500" />
                    </div>
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="input-field w-full pl-9 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-red-400 mt-1.5">Passwords do not match.</p>
                  )}
                  {confirmPassword && password === confirmPassword && confirmPassword.length >= 8 && (
                    <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Passwords match
                    </p>
                  )}
                </div>

                {/* Password requirements */}
                <div className="bg-navy-800/50 border border-navy-700/30 rounded-lg p-3 space-y-1.5">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Requirements</p>
                  {[
                    { label: 'At least 8 characters', met: password.length >= 8 },
                    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
                    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
                    { label: 'One special character (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
                  ].map((req) => (
                    <div key={req.label} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${
                        req.met ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-navy-700 border border-navy-600'
                      }`}>
                        {req.met && (
                          <svg width="6" height="5" viewBox="0 0 6 5" fill="none">
                            <path d="M1 2.5L2.5 4L5 1" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className={`text-[10px] ${req.met ? 'text-emerald-400' : 'text-gray-600'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-navy-950/40 border-t-navy-950 rounded-full animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Set New Password
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Success state */}
          {stage === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-100 mb-2">Password Updated!</h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Your password has been securely updated. You will be redirected to the login page in a few seconds.
              </p>
              <div className="bg-navy-800/60 border border-navy-700/40 rounded-xl p-4 text-left space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <ShieldCheck size={14} />
                  <span>Password hashed with bcrypt</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <ShieldCheck size={14} />
                  <span>All previous sessions invalidated</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <ShieldCheck size={14} />
                  <span>JWT tokens refreshed for new session</span>
                </div>
              </div>
              <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                Continue to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
