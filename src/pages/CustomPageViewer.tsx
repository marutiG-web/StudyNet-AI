import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CustomPage } from '../types';
import { 
  FileText, Calendar, ArrowLeft, Loader2, Globe, AlertTriangle, 
  BookOpen, Compass, Shield, Lock
} from 'lucide-react';

// Lightweight, safe, high-fidelity Markdown structural renderer for zero-dependency parsing
function renderContent(rawText: string) {
  if (!rawText) return null;

  const lines = rawText.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={idx} className="text-3xl sm:text-4xl font-extrabold text-white mt-8 mb-4 hover:text-indigo-400 transition duration-200">
          {parseInlineText(trimmed.substring(2))}
        </h1>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-2xl font-bold text-white mt-7 mb-3 pb-1 border-b border-slate-900">
          {parseInlineText(trimmed.substring(3))}
        </h2>
      );
    }
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-lg font-extrabold text-slate-200 mt-5 mb-2">
          {parseInlineText(trimmed.substring(4))}
        </h3>
      );
    }
    if (trimmed.startsWith('#### ')) {
      return (
        <h4 key={idx} className="text-sm font-bold text-slate-300 mt-4 mb-2 uppercase tracking-wide">
          {parseInlineText(trimmed.substring(5))}
        </h4>
      );
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <ul key={idx} className="list-disc pl-6 space-y-1 my-2 text-slate-300">
          <li className="text-xs sm:text-sm font-medium leading-relaxed">
            {parseInlineText(trimmed.substring(2))}
          </li>
        </ul>
      );
    }

    // Numbered List
    const matchNumbered = trimmed.match(/^(\d+)\.\s(.*)$/);
    if (matchNumbered) {
      return (
        <ol key={idx} className="list-decimal pl-6 space-y-1 my-2 text-slate-300">
          <li className="text-xs sm:text-sm font-medium leading-relaxed">
            {parseInlineText(matchNumbered[2])}
          </li>
        </ol>
      );
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      return (
        <blockquote key={idx} className="border-l-4 border-indigo-500 bg-slate-900/30 pl-4 py-2 my-4 text-xs font-mono text-slate-403 rounded-r-lg leading-relaxed select-none">
          {parseInlineText(trimmed.substring(1).trim())}
        </blockquote>
      );
    }

    // Paragraph (omit empty lines as layout spacing)
    if (trimmed === '') {
      return <div key={idx} className="h-3 md:h-4" />;
    }

    return (
      <p key={idx} className="text-xs sm:text-sm font-medium leading-relaxed text-slate-300 my-2">
        {parseInlineText(trimmed)}
      </p>
    );
  });
}

// Convert links [Text](URL) and emphasis **Text** into DOM JSX fragments
function parseInlineText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let keyIdx = 0;

  // Pattern detection loops
  while (currentText.length > 0) {
    // 1. Check Link: [label](url)
    const linkIndex = currentText.indexOf('[');
    const starIndex = currentText.indexOf('**');

    // Select the earliest pattern found
    if (linkIndex !== -1 && (starIndex === -1 || linkIndex < starIndex)) {
      // Add text before link
      if (linkIndex > 0) {
        parts.push(currentText.substring(0, linkIndex));
      }

      const closeBracketIndex = currentText.indexOf(']', linkIndex);
      const openParenIndex = currentText.indexOf('(', closeBracketIndex);
      const closeParenIndex = currentText.indexOf(')', openParenIndex);

      if (closeBracketIndex !== -1 && openParenIndex === closeBracketIndex + 1 && closeParenIndex !== -1) {
        const label = currentText.substring(linkIndex + 1, closeBracketIndex);
        const url = currentText.substring(openParenIndex + 1, closeParenIndex);

        parts.push(
          <a 
            key={`link-${keyIdx++}`} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-400 font-extrabold underline decoration-indigo-500/50 hover:text-indigo-300 hover:decoration-indigo-400 transition"
          >
            {label}
          </a>
        );

        currentText = currentText.substring(closeParenIndex + 1);
      } else {
        parts.push('[');
        currentText = currentText.substring(linkIndex + 1);
      }
    } 
    // 2. Check Bold: **boldText**
    else if (starIndex !== -1) {
      if (starIndex > 0) {
        parts.push(currentText.substring(0, starIndex));
      }

      const nextStarIndex = currentText.indexOf('**', starIndex + 2);
      if (nextStarIndex !== -1) {
        const boldContent = currentText.substring(starIndex + 2, nextStarIndex);
        parts.push(
          <strong key={`bold-${keyIdx++}`} className="font-extrabold text-white">
            {boldContent}
          </strong>
        );
        currentText = currentText.substring(nextStarIndex + 2);
      } else {
        parts.push('**');
        currentText = currentText.substring(starIndex + 2);
      }
    } 
    // 3. Just regular text
    else {
      parts.push(currentText);
      break;
    }
  }

  return parts;
}

export const CustomPageViewer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadPageContent(slug);
    }
  }, [slug]);

  const loadPageContent = async (pageSlug: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPageBySlug(pageSlug);
      if (res.success && res.page) {
        setPage(res.page);
      } else {
        setError(res.error || 'The page you are looking for does not exist.');
      }
    } catch {
      setError('Connection to data service interrupted. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 border-r-indigo-500/30 border-b-transparent border-l-transparent animate-spin duration-1000" />
          <div className="absolute inset-2 rounded-full border border-b-purple-500 border-l-purple-500/30 border-t-transparent border-r-transparent animate-spin-reverse duration-[1500ms]" />
          <div className="absolute inset-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <span className="text-sm font-bold tracking-widest text-indigo-400 uppercase select-none animate-pulse">
          Translating Academic Stream...
        </span>
        <span className="text-[10px] font-mono text-slate-500 mt-2 select-none">
          StudySec CDN secure content delivery active
        </span>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full bg-slate-900/30 border border-slate-900 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Page Unavailable
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {error || 'This campus resources portal has been permanently relocated or draft protected by faculty.'}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border border-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Campus</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Navigation link back block */}
        <div className="pb-8">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Campus Main</span>
          </Link>
        </div>

        {/* Dynamic Page Article Layout */}
        <article className="bg-slate-900/15 border border-slate-900/60 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none">
            <Globe className="w-40 h-40 text-white" />
          </div>

          <header className="pb-6 border-b border-slate-900/80 mb-8 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 text-[10px] font-black tracking-widest uppercase font-mono">
              <Compass className="w-4 h-4 text-indigo-500" />
              <span>Dynamic Resources Panel</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {page.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 pt-2">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                {new Date(page.createdAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Verified Faculty Publication</span>
              </span>
            </div>
          </header>

          {/* Core Content Body Content rendering */}
          <div className="prose prose-invert max-w-none text-slate-300">
            {page.isHtml ? (
              <div dangerouslySetInnerHTML={{ __html: page.content }} />
            ) : (
              renderContent(page.content)
            )}
          </div>
        </article>

        <footer className="mt-8 text-center text-[10px] text-slate-600 font-mono flex items-center justify-center space-x-1.5">
          <Lock className="w-3 h-3" />
          <span>SSL Encryption secured. All materials certified StudyNet.AI network.</span>
        </footer>

      </div>
    </div>
  );
};
export default CustomPageViewer;
