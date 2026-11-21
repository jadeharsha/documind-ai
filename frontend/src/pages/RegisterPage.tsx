import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Create Your Account</h2>
        <p className="text-xs text-slate-400 mt-1">Get started with intelligent document synthesis & agent workflows.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">First Name</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Harsha"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Last Name</label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Vardhan"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="harsha@documind.ai"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 characters"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="password"
              required
              value={formData.password_confirm}
              onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
              placeholder="Re-enter password"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-lg transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
            <span>Creating Account...</span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 text-center text-xs text-slate-400">
        Already registered?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
          Sign in here
        </Link>
      </div>
    </div>
  );
};
