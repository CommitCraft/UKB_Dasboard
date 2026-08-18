import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BookOpen, 
  Search, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Shield, 
  Cpu, 
  Server, 
  Database, 
  FileText, 
  Layout, 
  Code, 
  Activity, 
  AlertTriangle, 
  Settings, 
  ExternalLink,
  Printer,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  Terminal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService, endpoints } from '../utils/api';
import LayoutComponent from '../components/Layout/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// Icon Map for dynamic section rendering
const iconMap = {
  BookOpen,
  FileText,
  Shield,
  Layout,
  Server,
  Code,
  Database,
  Cpu,
  Activity,
  AlertTriangle,
  Settings,
  Terminal,
  Layers
};

// Simple Markdown / Rich Text Renderer with Code Copy Buttons & Tables
const MarkdownRenderer = ({ content }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success('Code copied to clipboard!', {
      duration: 2000,
      style: {
        background: '#1f2937',
        color: '#e5e7eb',
        border: '1px solid #374151',
        borderRadius: '8px',
        fontSize: '12px'
      }
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Parse lines into tokens (Headers, Code blocks, Tables, Lists, Paragraphs)
  const elements = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const parsed = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer = [];
    let codeBlockId = 0;

    let inTable = false;
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code Block Start/End
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.trim().replace('```', '') || 'text';
          codeBuffer = [];
          codeBlockId++;
        } else {
          inCodeBlock = false;
          parsed.push({
            type: 'code',
            id: `code-${codeBlockId}-${i}`,
            language: codeLanguage,
            code: codeBuffer.join('\n')
          });
          codeBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Tables Detection (lines with |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        // Skip separator line |---|---|
        if (!line.includes('---')) {
          const cells = line.split('|').slice(1, -1).map(c => c.trim());
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        inTable = false;
        parsed.push({
          type: 'table',
          rows: tableRows
        });
        tableRows = [];
      }

      // Headers
      if (line.startsWith('### ')) {
        parsed.push({ type: 'h3', text: line.replace('### ', '') });
      } else if (line.startsWith('#### ')) {
        parsed.push({ type: 'h4', text: line.replace('#### ', '') });
      } else if (line.startsWith('## ')) {
        parsed.push({ type: 'h2', text: line.replace('## ', '') });
      } else if (line.startsWith('# ')) {
        parsed.push({ type: 'h1', text: line.replace('# ', '') });
      } else if (line.trim() === '---') {
        parsed.push({ type: 'hr' });
      } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        parsed.push({ type: 'bullet', text: line.trim().substring(2) });
      } else if (/^\d+\.\s/.test(line.trim())) {
        parsed.push({ type: 'numbered', text: line.trim().replace(/^\d+\.\s/, '') });
      } else if (line.trim().length > 0) {
        parsed.push({ type: 'p', text: line });
      }
    }

    if (inTable && tableRows.length > 0) {
      parsed.push({ type: 'table', rows: tableRows });
    }

    return parsed;
  }, [content]);

  // Inline formatting helper (bold, code, links)
  const formatInline = (text) => {
    if (!text) return '';
    // Split by inline code `...`
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[11px] text-primary-600 dark:text-primary-400 border border-gray-200 dark:border-gray-700">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      {elements.map((item, idx) => {
        if (item.type === 'h1') {
          return <h1 key={idx} className="text-2xl font-black text-gray-900 dark:text-white pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">{formatInline(item.text)}</h1>;
        }
        if (item.type === 'h2') {
          return <h2 key={idx} className="text-xl font-bold text-gray-900 dark:text-white pt-3 pb-1 border-b border-gray-100 dark:border-gray-800">{formatInline(item.text)}</h2>;
        }
        if (item.type === 'h3') {
          return <h3 key={idx} className="text-base font-bold text-gray-900 dark:text-white pt-2 flex items-center gap-2">{formatInline(item.text)}</h3>;
        }
        if (item.type === 'h4') {
          return <h4 key={idx} className="text-sm font-bold text-gray-800 dark:text-gray-200 pt-1.5">{formatInline(item.text)}</h4>;
        }
        if (item.type === 'hr') {
          return <hr key={idx} className="my-6 border-gray-200 dark:border-gray-700" />;
        }
        if (item.type === 'bullet') {
          return (
            <div key={idx} className="flex items-start gap-2 ml-4">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
              <span>{formatInline(item.text)}</span>
            </div>
          );
        }
        if (item.type === 'numbered') {
          return (
            <div key={idx} className="flex items-start gap-2 ml-4">
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-0.5 shrink-0">•</span>
              <span>{formatInline(item.text)}</span>
            </div>
          );
        }
        if (item.type === 'p') {
          return <p key={idx}>{formatInline(item.text)}</p>;
        }
        if (item.type === 'table') {
          const [headers, ...rows] = item.rows;
          return (
            <div key={idx} className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                {headers && (
                  <thead className="bg-gray-100 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 font-bold border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="p-3 whitespace-nowrap">{formatInline(h)}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900/50">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3">{formatInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (item.type === 'code') {
          const isCopied = copiedCode === item.id;
          return (
            <div key={idx} className="relative group my-4 rounded-xl overflow-hidden border border-gray-800 bg-[#1e1e1e] shadow-lg">
              <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-800 text-[11px] font-mono text-gray-400">
                <span className="uppercase font-bold tracking-wider text-gray-300">{item.language}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(item.code, item.id)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-700/60 hover:bg-gray-700 text-gray-200 hover:text-white transition-all cursor-pointer"
                  title="Copy code"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono text-gray-200 leading-relaxed [scrollbar-width:thin]">
                <code>{item.code}</code>
              </pre>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

const DocsPage = () => {
  const { isSuperAdmin } = useAuth();
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSectionId, setActiveSectionId] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Fetch documentation from verified backend endpoint
  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.get(endpoints.docs.sections);
      if (res.data?.success && res.data?.data) {
        setDocData(res.data.data);
        if (res.data.data.sections?.length > 0 && !activeSectionId) {
          setActiveSectionId(res.data.data.sections[0].id);
        }
      } else {
        setError('Failed to retrieve system documentation.');
      }
    } catch (err) {
      console.error('Error fetching documentation:', err);
      setError(err.response?.data?.message || 'Access denied or server error.');
    } finally {
      setLoading(false);
    }
  }, [activeSectionId]);

  useEffect(() => {
    if (isSuperAdmin()) {
      fetchDocs();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin, fetchDocs]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!docData?.sections) return [];
    if (!searchQuery.trim()) return docData.sections;
    const q = searchQuery.toLowerCase();
    return docData.sections.filter(s => 
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q)
    );
  }, [docData, searchQuery]);

  // Active section data
  const currentSection = useMemo(() => {
    if (!docData?.sections) return null;
    return docData.sections.find(s => s.id === activeSectionId) || docData.sections[0];
  }, [docData, activeSectionId]);

  // Access check guard
  if (!isSuperAdmin()) {
    return (
      <LayoutComponent>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <div className="h-16 w-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Super Admin Access Required</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
            System Documentation and Architecture Specifications are strictly restricted to Super Administrators.
          </p>
          <a
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Return to Dashboard
          </a>
        </div>
      </LayoutComponent>
    );
  }

  if (loading) {
    return (
      <LayoutComponent>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </LayoutComponent>
    );
  }

  if (error) {
    return (
      <LayoutComponent>
        <div className="p-6 max-w-2xl mx-auto text-center">
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
            <h3 className="font-bold text-base mb-1">Documentation Load Error</h3>
            <p className="text-xs mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchDocs}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-all cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </LayoutComponent>
    );
  }

  const ActiveIcon = currentSection?.icon && iconMap[currentSection.icon] ? iconMap[currentSection.icon] : BookOpen;

  return (
    <LayoutComponent>
      <div className="space-y-6 pb-12">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-gray-900 to-primary-950 p-6 sm:p-8 text-white shadow-xl border border-gray-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-400/30 text-primary-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" /> Super Admin Manual & Architecture
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {docData?.title || 'System Documentation'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
                Official, verified technical manual, step-by-step operating instructions, REST API reference, and deployment procedures generated directly from actual project source code.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Version</p>
                <p className="text-xs font-black font-mono text-emerald-400">v{docData?.version || '1.0.0'}</p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Node.js</p>
                <p className="text-xs font-black font-mono text-blue-400">{docData?.systemInfo?.nodeVersion || 'v22'}</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 backdrop-blur-md transition-all cursor-pointer"
                title="Print Documentation"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Documentation Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, APIs, guides..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Topic List */}
            <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-sm p-3 overflow-hidden">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 mb-2">
                <span>Documentation Modules</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{filteredSections.length}</span>
              </div>

              <div className="space-y-1 max-h-[65vh] overflow-y-auto [scrollbar-width:thin] pr-1">
                {filteredSections.map((section, sIdx) => {
                  const IconComponent = section.icon && iconMap[section.icon] ? iconMap[section.icon] : BookOpen;
                  const isActive = activeSectionId === section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        setActiveSectionId(section.id);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-500/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl shrink-0 transition-colors ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="truncate flex-1">{section.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'translate-x-0.5 opacity-100' : 'opacity-40 group-hover:opacity-100'}`} />
                    </button>
                  );
                })}

                {filteredSections.length === 0 && (
                  <div className="py-6 text-center text-xs text-gray-400">
                    No documentation matched "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Main Content Viewer */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {currentSection ? (
              <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-sm p-6 sm:p-8 space-y-6">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 shadow-xs border border-primary-200 dark:border-primary-800 shrink-0">
                      <ActiveIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white">
                        {currentSection.title}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {currentSection.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">
                      Verified Codebase
                    </span>
                  </div>
                </div>

                {/* Section Content Markdown Body */}
                <div className="prose dark:prose-invert max-w-none">
                  <MarkdownRenderer content={currentSection.content} />
                </div>

                {/* Footer Navigation Next / Prev */}
                <div className="pt-8 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
                  {(() => {
                    const currentIndex = docData?.sections.findIndex(s => s.id === currentSection.id) || 0;
                    const prevSection = currentIndex > 0 ? docData?.sections[currentIndex - 1] : null;
                    const nextSection = currentIndex < (docData?.sections.length - 1) ? docData?.sections[currentIndex + 1] : null;

                    return (
                      <>
                        {prevSection ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSectionId(prevSection.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            <span className="truncate max-w-[140px] sm:max-w-xs">{prevSection.title}</span>
                          </button>
                        ) : <div />}

                        {nextSection && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSectionId(nextSection.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition-all cursor-pointer ml-auto"
                          >
                            <span className="truncate max-w-[140px] sm:max-w-xs">{nextSection.title}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500">
                Select a section from the navigation menu.
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutComponent>
  );
};

export default DocsPage;
