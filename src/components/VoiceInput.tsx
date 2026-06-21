import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, ExternalLink, X, HelpCircle, Check } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const recognitionRef = useRef<any>(null);

  // Use a ref to store onTranscript callback to avoid tearing down the SpeechRecognition instance on every render
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  });

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const rec = new SpeechRecognition();
    rec.continuous = true; // allow continuous listening for better essay / question dictation
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
      setPermissionState('granted');
    };

    rec.onresult = (event: any) => {
      const resultsLength = event.results.length;
      const latestResult = event.results[resultsLength - 1];
      if (latestResult && latestResult.isFinal) {
        const resultText = latestResult[0].transcript;
        if (resultText && resultText.trim()) {
          onTranscriptRef.current(resultText.trim());
        }
      }
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      if (event.error === 'not-allowed') {
        setError('Microphone permission blocked.');
        setPermissionState('denied');
        setShowPermissionHelp(true);
      } else if (event.error !== 'no-speech') {
        setError(`Speech Error: ${event.error}`);
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [isSupported]);

  const [isInIframe, setIsInIframe] = useState(false);

  // Detect sandboxed iframe environments
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsInIframe(window.self !== window.top);
    }
  }, []);

  // Proactively check browser's permission query API if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
      (navigator as any).permissions.query({ name: 'microphone' })
        .then((status: any) => {
          setPermissionState(status.state);
          status.onchange = () => {
            setPermissionState(status.state);
          };
        })
        .catch((err: any) => console.log('Permission API unsupported:', err));
    }
  }, []);

  const requestHardwareAccess = async (triggerHelpOnFail = false): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Clean up track immediately, we only wanted to prompt the system auth popup
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState('granted');
      return true;
    } catch (err: any) {
      console.warn('getUserMedia hardware prompt error/rejection ignored gracefully:', err);
      setPermissionState('denied');
      if (triggerHelpOnFail) {
        setShowPermissionHelp(true);
      }
      return false;
    }
  };

  const toggleListening = async () => {
    if (disabled || !isSupported) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (err) {
        console.error('Failed to stop speech recognition:', err);
      }
    } else {
      setError(null);
      
      // Attempt hardware authorization but DO NOT auto-trigger the overlay modal on initial click
      // to avoid obnoxious flash modals on browser block lists.
      const hasAccess = await requestHardwareAccess(false);
      
      try {
        recognitionRef.current?.start();
      } catch (err: any) {
        console.warn('Failed to start speech recognition gracefully:', err);
        if (!hasAccess) {
          setError('Microphone permission blocked.');
          // Auto-trigger detailed permissions guidance overlay only inside non-iframe contexts
          if (!isInIframe) {
            setShowPermissionHelp(true);
          }
        } else {
          setError('Could not access microphone.');
        }
      }
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isSupported) {
    return (
      <button
        disabled
        type="button"
        title="Web Speech API is not supported in this browser. Try Chrome or Safari."
        className="p-3.5 rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shrink-0"
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative flex items-center">
      {error && (
        <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-rose-600 text-white text-[10px] py-1 px-2.5 rounded-lg shadow-lg font-semibold z-50 animate-bounce flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
          <button 
            type="button" 
            onClick={() => setShowPermissionHelp(true)} 
            className="underline ml-1 hover:text-rose-100 font-extrabold cursor-pointer"
          >
            Guide
          </button>
        </div>
      )}

      {/* Main Mic Button */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleListening}
          disabled={disabled}
          type="button"
          className={`p-3.5 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0 ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-2 ring-rose-400 shadow-md shadow-rose-900/30'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-slate-700/50 dark:text-indigo-400 dark:hover:bg-slate-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isListening ? 'Stop Listening (Dictating...)' : 'Start Voice Dictation'}
        >
          {isListening ? (
            <div className="flex items-center space-x-1.5 min-w-[70px] justify-center">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-xs font-bold leading-none">Dictating</span>
            </div>
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Diagnostic help button if we're denied */}
        {permissionState === 'denied' && (
          <button
            type="button"
            onClick={() => setShowPermissionHelp(true)}
            className="p-2 text-amber-500 hover:text-amber-600 transition"
            title="Microphone Troubleshooting Guide"
          >
            <HelpCircle className="w-4 h-4 animate-pulse" />
          </button>
        )}
      </div>

      {/* Modern Permission Assistance Overlay Modal */}
      {showPermissionHelp && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Microphone Setup Guide
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enable voice typing for your study adventures.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPermissionHelp(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-4">
              
              {/* Highlight iframe context box */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                <div className="flex gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-bold mb-1">💡 Sandbox Environment Constraint</p>
                    <p className="leading-relaxed">
                      Browsers strictly block microphone access inside <strong>iframes</strong>. Clicking the button in this preview window will fail to activate standard popups.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step instructions */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Follow these steps to enable:
                </p>

                {/* 1. Open in new tab */}
                <div className="flex gap-3 items-start p-3 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-xs">
                    1
                  </span>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                      Open Applet in a New Tab
                    </p>
                    <p className="mb-2 leading-relaxed">
                      Click the <strong className="text-indigo-600 dark:text-indigo-400">Open</strong> (or external link icon) in the top-right header of your screen to load StudyNet outside the sandbox.
                    </p>
                    <a
                      href={window.location.origin || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                    >
                      <span>Launch in Standalone Tab</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 2. Standard browser unlock */}
                <div className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-500 text-white font-extrabold text-xs">
                    2
                  </span>
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">
                      Tap Allow on Browser Prompt
                    </p>
                    Once open in the new tab, clicking the Microphone button will trigger your browser's native permission bar. Tap <strong>Allow</strong> to start.
                  </div>
                </div>

                {/* 3. Lock icon reset */}
                <div className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-500 text-white font-extrabold text-xs">
                    3
                  </span>
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p className="font-bold text-slate-800 dark:text-white mb-1">
                      Unlock Website Permissions
                    </p>
                    If blocked previously, click the 🔒 (lock settings) icon on the left side of your browser's address input bar, toggle <strong>Microphone</strong> to <strong>Allow</strong>, and refresh.
                  </div>
                </div>

              </div>

            </div>

            {/* Footer buttons */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={async () => {
                  const verified = await requestHardwareAccess();
                  if (verified) {
                    setShowPermissionHelp(false);
                    setError(null);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Trigger Native Prompt</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPermissionHelp(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Got It
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;

