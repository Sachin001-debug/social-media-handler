import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Share2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('sachin@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    const run = async () => {
      try {
        const user = await login(email, password);
        showToast(`Welcome back, ${user.name}!`, 'success');
        navigate('/dashboard');
      } catch (error) {
        showToast(error.message, 'danger');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    showToast('Password reset link sent to ' + (email || 'your email'), 'info');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#172033] text-white flex items-center justify-center font-bold shadow-subtle">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#111827]">Socially</span>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-[#111827]">
          Welcome back
        </h2>
        <p className="mt-1 text-center text-sm text-[#6B7280]">
          Sign in to manage your social media
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 border border-[#E5E7EB] rounded-2xl shadow-subtle">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-3.5 py-2.5 text-sm bg-white border ${
                  errors.email ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
                } rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#172033] focus:border-[#172033]`}
              />
              {errors.email && (
                <p className="text-xs text-[#DC2626] mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border ${
                    errors.password ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
                  } rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#172033] focus:border-[#172033]`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#DC2626] mt-1.5">{errors.password}</p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#D1D5DB] text-[#172033] focus:ring-[#172033]"
                />
                <span className="text-[#6B7280]">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-medium text-[#172033] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[#172033] hover:bg-[#1F2B45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#172033] transition-colors shadow-subtle disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center text-xs text-[#6B7280]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#172033] hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
