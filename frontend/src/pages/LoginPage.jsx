import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Moon, Sun, Mail, Lock, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isValidEmail } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const logoUrl = "https://cdn.enfsolar.com/ID/logo/60779d90f067a.jpg?v=1";

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!isValidEmail(formData.email)) newErrors.email = 'Enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden font-sans">
      
      {/* Background Decorative Mesh & Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 bg-[#00629F]/15 dark:bg-[#00629F]/20 rounded-full filter blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/15 dark:bg-sky-500/10 rounded-full filter blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main Split Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row overflow-hidden z-10 min-h-[620px]"
      >
        
        {/* Left Side - Brand Hero Section */}
        <div className="lg:w-1/2 bg-gradient-to-br from-[#00629F] via-[#004f82] to-[#003358] p-8 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden min-h-[300px] lg:min-h-[620px]">
          
          {/* Subtle Ambient Orbs in Hero */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full filter blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-400/20 rounded-full filter blur-2xl pointer-events-none" />

          {/* Top Brand Logo Container */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 px-4 py-2.5 rounded-2xl shadow-lg border border-white/20 backdrop-blur-md">
              <img
                src={logoUrl}
                alt="Brand Logo"
                className="h-9 w-auto max-w-[160px] object-contain"
              />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-xs border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Enterprise v1.0
            </span>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 my-8 lg:my-0 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                Aplos Logix MES Management Portal
              </h1>
              <p className="mt-3 text-sm text-sky-100/90 leading-relaxed max-w-md">
                Streamline production monitoring, machine operations, quality tracking, and system controls in one unified MES platform.
              </p>
            </div>

            {/* Feature Highlights List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 px-4 py-2.5 rounded-xl border border-white/10 transition-colors">
                <ShieldCheck className="h-5 w-5 text-sky-300 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white">Real-Time Production & Machine Monitoring</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 px-4 py-2.5 rounded-xl border border-white/10 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white">OEE, Production, Quality & Downtime Management</span>
              </div>
            </div>
          </div>

          {/* Hero Bottom Footer */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-sky-200/80">
            <span>© {new Date().getFullYear()} Aplos Logix Pvt. Ltd.</span>
            <span>All Rights Reserved</span>
          </div>
        </div>

        {/* Right Side - Form Panel */}
        <div className="lg:w-1/2 p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white dark:bg-slate-900">
          
          {/* Top Bar with Theme Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00629F]" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Portal Access
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#00629F] dark:hover:text-sky-400 hover:border-[#00629F]/40 transition-all duration-200 cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Welcome back!
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Please enter your credentials to sign in to your dashboard.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="name@company.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white transition-all outline-none
                  focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#00629F]/30 focus:border-[#00629F]
                  ${errors.email ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 dark:border-slate-700'}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 font-medium mt-1">{errors.email}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white transition-all outline-none
                  focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#00629F]/30 focus:border-[#00629F]
                  ${errors.password ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 dark:border-slate-700'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium mt-1">{errors.password}</p>}
            </div>

            {/* Sign In Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#00629F] to-[#004f82] hover:from-[#00548a] hover:to-[#003e68] shadow-lg shadow-[#00629F]/25 hover:shadow-xl hover:shadow-[#00629F]/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Form Bottom Info */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Protected by Enterprise Authentication & Authorization System • Aplos Logix Pvt. Ltd.
            </p>
          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default LoginPage;
