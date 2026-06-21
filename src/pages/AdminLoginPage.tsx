import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, ArrowRight, Loader2, GraduationCap, Eye, EyeOff } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide administrative credentials.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Invalid administrator credentials.');
    }
  };

  const handlePreFill = () => {
    setEmail('admin@studybot.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-[calc(screen-16vh)] bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ShieldAlert className="h-12 w-12 text-rose-500 animate-pulse" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white leading-tight">
          Faculty Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or return to{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition">
            Student Classroom Login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-800">
          
          {error && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-900/50 text-rose-300 rounded-lg text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Faculty Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="admin@studybot.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Secret Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition cursor-pointer focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 flex justify-center items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-rose-650 bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Verifying session...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Command Console</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
export default AdminLoginPage;
