import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Mail, ArrowLeft, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Stage = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const { error: err } = await forgotPassword(email.trim());
    setLoading(false);

    if (err) {
      // Backend returns success even if email doesn't exist (security by design)
      // Show success either way to prevent email enumeration
      setStage('sent');
      return;
    }
    setStage('sent');
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
          <p className="text-sm text-gray-400 mt-1.5">Password Recovery</p>
        </div>

        <div className="bg-navy-900/90 border border-navy-700/50 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {stage === 'form' ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-navy-700/40">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-gold-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-100">Reset Your Password</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Enter your registered email to receive a reset link</p>
                </div>
              </div>

              {/* Workflow steps */}
              <div className="flex items-center gap-0 mb-6">
                {[
                  { label: 'Enter Email', active: true },
                  { label: 'Verify Link', active: false },
                  { label: 'New Password', active: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                        step.active
                          ? 'bg-gold-500 border-gold-400 text-navy-950'
                          : 'bg-navy-800 border-navy-600 text-gray-500'
                      }`}>{i + 1}</div>
                      <span className={`text-[9px] mt-1 font-medium ${step.active ? 'text-gold-400' : 'text-gray-600'}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < 2 && <div className="h-px flex-1 bg-navy-700/60 mb-4" />}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-medium text-gray-400 mb-1.5">
                    Registered Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field w-full"
                    autoComplete="email"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    A secure password reset link will be sent to this address.
                  </p>
                </div>

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
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-navy-700/40 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gold-400 transition-colors font-medium"
                >
                  <ArrowLeft size={13} />
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            /* Success state */
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-100 mb-2">Reset Link Sent!</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  If <span className="text-gold-400 font-medium">{email}</span> is registered on our platform, you will receive a password reset link in your inbox within a few minutes.
                </p>

                <div className="mt-6 bg-navy-800/60 border border-navy-700/40 rounded-xl p-4 text-left space-y-2.5">
                  <p className="text-xs font-semibold text-gray-300">Next steps:</p>
                  {[
                    'Check your email inbox (and spam/junk folder)',
                    'Click the secure reset link in the email',
                    'The link expires in 5 minutes for security',
                    'Create a strong new password (min. 8 characters)',
                    'You will be redirected to login after reset',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-gold-400">{i + 1}</span>
                      </div>
                      <span className="text-xs text-gray-400">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={() => { setStage('form'); setEmail(''); }}
                    className="btn-secondary text-xs py-2.5"
                  >
                    Try Different Email
                  </button>
                  <Link to="/login" className="btn-primary text-xs py-2.5 text-center">
                    Back to Login
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-5">
          Reset links expire in 1 hour · Secured by JWT Authentication
        </p>
      </div>
    </div>
  );
}
