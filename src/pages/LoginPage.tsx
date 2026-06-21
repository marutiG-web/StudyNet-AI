import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ShieldCheck, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { OTPVerification } from '../components/OTPVerification';
import { SEO } from '../components/SEO';

export const LoginPage: React.FC = () => {
  const { login, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dynamic state to capture unverified profiles
  const [verifyProps, setVerifyProps] = useState<{ userId: string; email: string; message?: string; debugOtp?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      if (result.requiresVerification) {
        setVerifyProps({
          userId: result.userId || '',
          email: result.email || email,
          message: result.message,
          debugOtp: result.debugOtp
        });
        return;
      }
      // Redirect based on role
      const token = localStorage.getItem('studybot_token');
      // Look up role by checking decoded user state or let App route handle it
      // For immediate redirection:
      if (email.toLowerCase().includes('admin')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/chat');
      }
    } else {
      setError(result.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handlePreFill = (role: 'student' | 'admin') => {
    if (role === 'student') {
      setEmail('student@studybot.com');
      setPassword('student123');
    } else {
      setEmail('admin@studybot.com');
      setPassword('admin123');
    }
    setError(null);
  };

  if (verifyProps) {
    return (
      <div className="min-h-[calc(100vh-16vh)] bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <OTPVerification
          userId={verifyProps.userId}
          email={verifyProps.email}
          initialMessage={verifyProps.message}
          debugOtp={verifyProps.debugOtp}
          onSuccess={(userData) => {
            setUser(userData);
            if (verifyProps.email.toLowerCase().includes('admin')) {
              navigate('/admin/dashboard');
            } else {
              navigate('/chat');
            }
          }}
          onCancel={() => {
            setVerifyProps(null);
            setError(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <SEO title="Academic Sign In" description="Securely login to StudyNet.AI educational workspace and access custom textbooks." />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <GraduationCap className="h-12 w-12 text-indigo-400 animate-pulse" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-black text-white tracking-tight leading-tight">
          Welcome to StudyNet<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">.AI</span>
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400 font-mono tracking-wide uppercase">
          Or{' '}
          <Link to="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition">
            create a new student profile
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-4 sm:rounded-3xl sm:px-10 border border-slate-800/80 shadow-2xl shadow-slate-950">
          
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                Academic Email address
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 block w-full px-3 py-3 border border-slate-800 bg-slate-950/60 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50"
                  placeholder="name@edu.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                Password
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 block w-full px-3 py-3 border border-slate-800 bg-slate-950/60 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50"
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
                className="w-full h-11 flex justify-center items-center px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 via-purple-650 to-pink-500 hover:opacity-90 shadow-lg shadow-indigo-950/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Study Portal</span>
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
export default LoginPage;
