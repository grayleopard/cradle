import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if user has a valid session (from the reset link)
    const checkSession = async () => {
      if (!supabase) {
        setError('Authentication service not available');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };

    checkSession();
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!supabase) {
      setError('Authentication service not available');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to home after a moment
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FFFCF9] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-warm-lg p-8 text-center">
          <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#2D9B8C]" />
          </div>
          <h1 className="text-xl font-serif font-semibold text-[#4A3F37] mb-2">
            Password Updated!
          </h1>
          <p className="text-[#6B5D52] mb-4">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <p className="text-sm text-[#B8A395]">Redirecting you to the home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF9]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E8DDD4] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-[#F5EDE6] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
          </button>
          <h1 className="font-serif text-xl font-semibold text-[#4A3F37]">Reset Password</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {!hasSession ? (
          <div className="bg-white rounded-2xl shadow-warm-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-2">
              Link Expired
            </h2>
            <p className="text-[#6B5D52] mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#2D9B8C] text-white rounded-full font-medium hover:bg-[#247A6F] transition-colors"
            >
              Go Home
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-warm-lg p-6">
            <h2 className="text-xl font-serif font-semibold text-[#4A3F37] mb-2">
              Create New Password
            </h2>
            <p className="text-[#6B5D52] mb-6 text-sm">
              Your new password must be different from your previous password.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6B5D52] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D9B8C]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-12 pr-12 py-4 rounded-xl text-lg outline-none transition-all bg-white border border-[#E8DDD4] text-[#4A3F37] focus:ring-1 focus:ring-[#2D9B8C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8A395] hover:text-[#6B5D52]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6B5D52] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D9B8C]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-lg outline-none transition-all bg-white border border-[#E8DDD4] text-[#4A3F37] focus:ring-1 focus:ring-[#2D9B8C]"
                  />
                </div>
              </div>

              {/* Password requirements */}
              <div className="bg-[#F9F6F0] rounded-xl p-4 text-sm">
                <p className="font-medium text-[#4A3F37] mb-2">Password requirements:</p>
                <ul className="space-y-1 text-[#6B5D52]">
                  <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-[#2D9B8C]' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-[#2D9B8C]' : 'bg-[#B8A395]'}`} />
                    At least 8 characters
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-[#2D9B8C]' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-[#2D9B8C]' : 'bg-[#B8A395]'}`} />
                    One uppercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-[#2D9B8C]' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(password) ? 'bg-[#2D9B8C]' : 'bg-[#B8A395]'}`} />
                    One lowercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-[#2D9B8C]' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-[#2D9B8C]' : 'bg-[#B8A395]'}`} />
                    One number
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full py-4 rounded-full font-bold text-lg disabled:opacity-50 bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors shadow-warm-md"
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
