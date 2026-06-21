import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { ShieldAlert, ShieldCheck, RefreshCw, Landmark, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OTPVerificationProps {
  userId: string;
  email: string;
  initialMessage?: string;
  debugOtp?: string;
  onSuccess: (userData: any) => void;
  onCancel: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  userId,
  email,
  initialMessage,
  debugOtp,
  onSuccess,
  onCancel
}) => {
  const { setUser } = useAuth();
  
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(initialMessage || null);
  const [currentDebugOtp, setCurrentDebugOtp] = useState<string | null>(debugOtp || null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    // Focus the first input box on load
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown active countdown ticks
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const val = element.value.replace(/[^0-9]/g, '');
    if (!val) return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto focus next input
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pastedData.length >= 6) {
      const pasteArray = pastedData.substring(0, 6).split('');
      setOtp(pasteArray);
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please provide the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.otpVerify(userId, code);
      if (res.success) {
        setSuccessMsg('Email Identity Verified Successfully!');
        if (res.token) {
          localStorage.setItem('studybot_token', res.token);
        }
        if (res.refreshToken) {
          localStorage.setItem('studybot_refresh_token', res.refreshToken);
        }
        setTimeout(() => {
          onSuccess(res.user);
        }, 1500);
      } else {
        setError(res.error || 'The entered OTP code is incorrect or expired.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.otpSend(userId);
      if (res.success) {
        setInfoMsg(res.message || 'A new 6-digit code has been dispatched to your email.');
        if (res.debugOtp) {
          setCurrentDebugOtp(res.debugOtp);
        } else {
          setCurrentDebugOtp(null);
        }
        setCooldown(60);
        // Clear inputs
        setOtp(new Array(6).fill(''));
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      } else {
        setError(res.error || 'Failed to dispatch high-security OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP resending failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100 max-w-md w-full mx-auto">
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 mb-4">
          <Landmark className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">OTP Security Check</h3>
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
          Enter OTP sent to your email/phone:
          <br />
          <span className="font-bold text-slate-700 underline">{email}</span>
        </p>
      </div>

      <div className="mb-4 p-3.5 bg-indigo-50/50 border border-indigo-100/40 rounded-xl text-center">
        <p className="text-xs text-indigo-950 leading-relaxed font-semibold">
          {infoMsg ? infoMsg : "OTP sent successfully. Please check your email inbox."}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {currentDebugOtp && (
        <div className="mb-4 p-3.5 bg-amber-50/70 border border-amber-200/50 rounded-xl text-center">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 mb-2">
            Sandbox Security Bypass Code
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-lg font-black tracking-widest text-amber-900 bg-white px-3.5 py-1 rounded-lg border border-amber-300 shadow-sm select-all">
              {currentDebugOtp}
            </span>
            <button
              onClick={() => {
                const arr = currentDebugOtp.split('').slice(0, 6);
                setOtp(arr);
                // focus the last box
                if (inputRefs.current[5]) {
                  setTimeout(() => inputRefs.current[5].focus(), 10);
                }
              }}
              type="button"
              className="text-xs bg-amber-600 hover:bg-amber-750 text-white font-bold py-1.5 px-3 rounded-xl transition"
            >
              Fill Code
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
          {otp.map((data, idx) => (
            <input
              key={idx}
              type="text"
              name={`otp-${idx}`}
              maxLength={1}
              ref={(el) => {
                if (el) inputRefs.current[idx] = el;
              }}
              value={data}
              onChange={(e) => handleChange(e.target, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="w-12 h-14 text-center border-2 border-slate-200 focus:border-indigo-500 rounded-xl text-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.some(v => !v)}
          className="w-full h-11 flex justify-center items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <span>Verify Security Code</span>
          )}
        </button>
      </form>

      <div className="mt-5 text-center flex flex-col gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isLoading}
          className="inline-flex items-center justify-center text-xs font-bold text-indigo-600 hover:text-indigo-500 transition disabled:opacity-40 select-none cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${cooldown > 0 ? 'animate-pulse' : ''}`} />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Request New Verification Code'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="inline-flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Cancel and return to Login
        </button>
      </div>
    </div>
  );
};
