'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { supabase } from '@/lib/supabase';
import { UserButton } from '@clerk/nextjs';
import {
  Play,
  Share,
  ArrowLeft,
  Copy,
  Check,
  Eye,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback } from 'react';

// type Runtime = {
//   language: string;
//   version: string;
//   aliases?: string[];
//   runtime?: string;
// };

type Project = {
  id: string;
  title: string;
  code: string;
  language: string;
  version: string;
  user_id: string;
  is_public: boolean;
  share_token: string | null;
  created_at: string;
  updated_at: string;
};

// type PanelType = 'output' | 'debug';

export default function IDEPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [version, setVersion] = useState('');
  // const [_runtimes, setRuntimes] = useState<Runtime[]>([]);
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // const [_panel, setPanel] = useState<PanelType>('output');
  const [editorWidth, setEditorWidth] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Gemini state
  const [geminiQuery, setGeminiQuery] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState<{ summary: string; newCode: string } | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  
  // State for collapsible panels on mobile
  const [activeMobilePanel, setActiveMobilePanel] = useState<'input' | 'output' | 'gemini'>('output');

  // State for vertical panel resizing
  const [panelHeights, setPanelHeights] = useState([25, 45, 30]); // [input, output, gemini] percentages
  const [isDraggingPanel, setIsDraggingPanel] = useState<number | null>(null); // index of divider being dragged
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);


  // Detect mobile devices
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);



  // // Load runtimes
  // useEffect(() => {
  //   fetchRuntimes();
  // }, []);



  const loadProject = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error loading project:', error);
        router.push('/dashboard');
        return;
      }

      setProject(data);
      setCode(data.code);
      setLanguage(data.language);
      setVersion(data.version);

      // Check permissions
      const isProjectOwner = data.user_id === user?.id;
      setIsOwner(isProjectOwner);
      setHasEditPermission(isProjectOwner); // For now, only owners can edit

      if (data.share_token) {
        setShareUrl(`${process.env.NEXT_PUBLIC_APP_URL}/shared/${data.share_token}`);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      router.push('/dashboard');
    }
  }, [projectId, router, user?.id]);

  // Load project data
  useEffect(() => {
    if (projectId && user) {
      loadProject();
    }
  }, [projectId, user, loadProject]);

  // const fetchRuntimes = async () => {
  //   try {
  //     const res = await fetch('/api/listLanguage', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //     });
      
  //     const data = await res.json();
  //     setRuntimes(data);
  //   } catch (error) {
  //     console.error('Failed to fetch runtimes:', error);
  //   }
  // };

  const saveProject = useCallback(async () => {
    if (!project || !hasEditPermission) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          code,
          language,
          version,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setSaving(false);
    }
  }, [project, hasEditPermission, code, language, version, projectId]);

  // Auto-save functionality
  useEffect(() => {
    if (project && hasEditPermission && code !== project.code) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProject();
      }, 1000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [code, project, hasEditPermission, saveProject]);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, version, stdin: input }),
      });
      const data = await res.json();
      setOutput(data.output || data.error);
    } catch (error) {
      setOutput('Error executing code');
      console.error('Execution error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShareToken = async () => {
    if (!isOwner) return;

    try {
      const shareToken = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      const { error } = await supabase
        .from('projects')
        .update({
          share_token: shareToken,
          is_public: true
        })
        .eq('id', projectId);

      if (error) throw error;

      const newShareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared/${shareToken}`;
      setShareUrl(newShareUrl);
      setProject(prev => prev ? { ...prev, share_token: shareToken, is_public: true } : null);
    } catch (error) {
      console.error('Error generating share token:', error);
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleAskGemini = async () => {
    setGeminiLoading(true);
    setGeminiResponse(null);
    setGeminiError(null);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, query: geminiQuery }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeminiResponse(data);
      } else {
        setGeminiError(data.error || 'Failed to get response from Gemini.');
      }
    } catch (error) {
      setGeminiError('Error communicating with Gemini.');
      console.error('Gemini error:', error);
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleAcceptCode = () => {
    if (geminiResponse?.newCode) {
      setCode(geminiResponse.newCode);
      setGeminiResponse(null);
    }
  };


  // Resizing logic for main panels
  const startDrag = () => {
    if (isMobile) return;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopDrag = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const onDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || isMobile) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    const newWidthPercentage = (mouseX / containerWidth) * 100;

    setEditorWidth(Math.min(Math.max(newWidthPercentage, 30), 85));
  }, [isDragging, isMobile, containerRef]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDrag);
      return () => {
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', stopDrag);
      };
    }
  }, [isDragging, onDrag, stopDrag]);
  
  // Vertical Resizing Logic for side panel
  const startPanelDrag = useCallback((e: React.MouseEvent, dividerIndex: number) => {
    e.preventDefault();
    setIsDraggingPanel(dividerIndex);
    dragStartY.current = e.clientY;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopPanelDrag = useCallback(() => {
    setIsDraggingPanel(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);
  
  const onPanelDrag = useCallback((e: MouseEvent) => {
    if (isDraggingPanel === null || !rightPanelRef.current) return;

    const deltaY = e.clientY - dragStartY.current;
    dragStartY.current = e.clientY;

    const totalHeight = rightPanelRef.current.getBoundingClientRect().height;
    if (totalHeight === 0) return;
    
    const deltaPercent = (deltaY / totalHeight) * 100;

    const newHeights = [...panelHeights];
    const minHeight = 10;

    if (isDraggingPanel === 0) { // Divider between Input and Output
      if (newHeights[0] + deltaPercent > minHeight && newHeights[1] - deltaPercent > minHeight) {
        newHeights[0] += deltaPercent;
        newHeights[1] -= deltaPercent;
        setPanelHeights(newHeights);
      }
    } else if (isDraggingPanel === 1) { // Divider between Output and Gemini
      if (newHeights[1] + deltaPercent > minHeight && newHeights[2] - deltaPercent > minHeight) {
        newHeights[1] += deltaPercent;
        newHeights[2] -= deltaPercent;
        setPanelHeights(newHeights);
      }
    }

  }, [isDraggingPanel, panelHeights]);

  useEffect(() => {
    if (isDraggingPanel !== null) {
      window.addEventListener('mousemove', onPanelDrag);
      window.addEventListener('mouseup', stopPanelDrag);
      return () => {
        window.removeEventListener('mousemove', onPanelDrag);
        window.removeEventListener('mouseup', stopPanelDrag);
      };
    }
  }, [isDraggingPanel, onPanelDrag, stopPanelDrag]);


  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading project...</div>
      </div>
    );
  }

  // Responsive layout values
  const editorStyle = {
    width: isMobile ? '100%' : `${editorWidth}%`,
    height: isMobile ? '50vh' : '100%'
  };

  const panelStyle = {
    width: isMobile ? '100%' : `${100 - editorWidth}%`,
    height: isMobile ? '50vh' : '100%'
  };

  const mobilePanelContent = (panel: 'input' | 'output' | 'gemini') => (
    <div className={`flex-1 overflow-y-auto p-4 ${activeMobilePanel === panel ? '' : 'hidden'}`}>
      {panel === 'input' && (
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm resize-none"
          placeholder="Enter input for your code here..."
        />
      )}
      {panel === 'output' && (
        <pre className="h-full bg-gray-800 border border-gray-700 rounded p-4 text-green-400 whitespace-pre-wrap overflow-auto text-sm">
          {output || 'Run the code to see output here.'}
        </pre>
      )}
      {panel === 'gemini' && (
        <div className="space-y-2">
           <textarea
              value={geminiQuery}
              onChange={(e) => setGeminiQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm"
              rows={2}
              placeholder="Ask Assistant to explain, refactor, or optimize..."
            />
            <button
              onClick={handleAskGemini}
              className="w-full bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded flex items-center justify-center space-x-2 transition text-sm"
              disabled={geminiLoading}
            >
              <span>{geminiLoading ? 'Thinking...' : 'Ask Assistant'}</span>
            </button>

            {geminiLoading && <div className="mt-2 text-center">Loading...</div>}
            {geminiError && <div className="mt-2 p-2 bg-red-900/50 text-red-400 rounded">{geminiError}</div>}
            {geminiResponse && (
              <div className="mt-2 bg-gray-700 rounded p-2 space-y-2">
                <div>
                  <h3 className="font-bold">Summary:</h3>
                  <p className="text-sm">{geminiResponse.summary}</p>
                </div>
                <div>
                  <h3 className="font-bold">New Code:</h3>
                  <pre className="bg-gray-800 border border-gray-600 rounded p-2 text-sm overflow-auto max-h-32">
                    <code>{geminiResponse.newCode}</code>
                  </pre>
                </div>
                <button
                  onClick={handleAcceptCode}
                  className="w-full bg-green-600 hover:bg-green-700 py-2 rounded transition"
                >
                  Accept Code
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-900 text-white p-0 font-sans">
      <div className="flex flex-col h-screen" ref={containerRef}>
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold">{project.title}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span className="capitalize">{language}</span>
                  {saving && <span>• Saving...</span>}
                  {!hasEditPermission && (
                    <span className="flex items-center space-x-1">
                      • <Eye className="h-3 w-3" /> <span>Read-only</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isOwner && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded flex items-center space-x-2 transition text-sm"
                >
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </button>
              )}

              <button
                onClick={handleRun}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded flex items-center space-x-2 transition text-sm"
                disabled={loading}
              >
                <Play className="h-4 w-4" />
                <span>{loading ? 'Running...' : 'Run'}</span>
              </button>

              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Language Selection */}
        <div className="bg-gray-800 border-b border-gray-700 p-3">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Language:</label>
            <span className="bg-gray-700 px-3 py-1 rounded text-sm capitalize">{language}</span>
          </div>
        </div>

        <div className={`flex flex-1 ${isMobile ? 'flex-col' : 'flex-row'} overflow-hidden`}>
          {/* Left Panel - Code Editor */}
          <div
            className="relative"
            style={editorStyle}
          >
            <Editor
              height="100%"
              language={language === 'c++' ? 'cpp' : language}
              value={code}
              theme="vs-dark"
              onChange={(value) => hasEditPermission && setCode(value || '')}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                tabSize: 2,
                readOnly: !hasEditPermission,
              }}
            />
          </div>

          {/* Resizable Divider - Hidden on mobile */}
          {!isMobile && (
            <div
              className={`w-2 h-full bg-gray-700 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 transition-colors ${isDragging ? 'bg-blue-600' : ''}`}
              onMouseDown={startDrag}
            />
          )}

          {/* Right Panel */}
          {isMobile ? (
            <div className="flex flex-col" style={panelStyle}>
              <div className="flex bg-gray-800 border-t border-gray-700">
                <button 
                  onClick={() => setActiveMobilePanel('input')}
                  className={`flex-1 p-2 text-sm ${activeMobilePanel === 'input' ? 'bg-gray-700' : ''}`}
                >
                  Input
                </button>
                <button 
                  onClick={() => setActiveMobilePanel('output')}
                  className={`flex-1 p-2 text-sm ${activeMobilePanel === 'output' ? 'bg-gray-700' : ''}`}
                >
                  Output
                </button>
                <button 
                  onClick={() => setActiveMobilePanel('gemini')}
                  className={`flex-1 p-2 text-sm ${activeMobilePanel === 'gemini' ? 'bg-gray-700' : ''}`}
                >
                  Ask Assistant
                </button>
              </div>
              {mobilePanelContent('input')}
              {mobilePanelContent('output')}
              {mobilePanelContent('gemini')}
            </div>
          ) : (
             <div
                ref={rightPanelRef}
                className="flex flex-col bg-gray-950 overflow-hidden"
                style={panelStyle}
              >
                {/* Input Section */}
                <div className="flex flex-col overflow-hidden bg-gray-800" style={{ height: `${panelHeights[0]}%` }}>
                   <div className="p-4 border-b border-gray-700 flex-shrink-0">
                      <label className="block text-sm font-medium">Input:</label>
                    </div>
                    <div className="flex-1 p-4 pt-2 overflow-y-auto">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full h-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm resize-none"
                        placeholder="Enter input for your code here..."
                      />
                    </div>
                </div>

                {/* Resizer 1 */}
                <div
                    className="h-2 w-full bg-gray-700 cursor-row-resize hover:bg-blue-500 active:bg-blue-600 transition-colors flex-shrink-0"
                    onMouseDown={(e) => startPanelDrag(e, 0)}
                  />
                
                {/* Output Section */}
                <div className="flex flex-col overflow-hidden" style={{ height: `${panelHeights[1]}%` }}>
                  <div className="p-4 flex-shrink-0">
                      <h2 className="text-lg font-bold flex items-center space-x-2">
                        <Play className="h-5 w-5" />
                        <span>Output</span>
                      </h2>
                    </div>
                    <div className="flex-1 p-4 pt-0 overflow-y-auto">
                      <pre className="h-full bg-gray-800 border border-gray-700 rounded p-4 text-green-400 whitespace-pre-wrap overflow-auto text-sm">
                        {output || 'Run the code to see output here.'}
                      </pre>
                    </div>
                </div>

                {/* Resizer 2 */}
                <div
                    className="h-2 w-full bg-gray-700 cursor-row-resize hover:bg-blue-500 active:bg-blue-600 transition-colors flex-shrink-0"
                    onMouseDown={(e) => startPanelDrag(e, 1)}
                  />

                {/* Ask Assistant Section */}
                <div className="flex flex-col overflow-hidden bg-gray-800" style={{ height: `${panelHeights[2]}%` }}>
                   <div
                    className="p-4 flex justify-between items-center cursor-pointer flex-shrink-0"
                    onClick={() => setPanelHeights(panelHeights[2] > 10 ? [45,45,10] : [30,30,40])}
                  >
                    <h2 className="text-lg font-bold flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      <span>Ask Assistant</span>
                    </h2>
                    {panelHeights[2] > 10 ? <ChevronDown /> : <ChevronUp />}
                  </div>
                  
                  {panelHeights[2] > 10 && (
                     <div className="flex-1 p-4 pt-0 overflow-y-auto">
                        <textarea
                          value={geminiQuery}
                          onChange={(e) => setGeminiQuery(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm"
                          rows={2}
                          placeholder="Ask Assistant to explain, refactor, or optimize..."
                        />
                        <button
                          onClick={handleAskGemini}
                          className="mt-2 w-full bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded flex items-center justify-center space-x-2 transition text-sm"
                          disabled={geminiLoading}
                        >
                          <span>{geminiLoading ? 'Thinking...' : 'Ask Assistant'}</span>
                        </button>

                        {geminiLoading && <div className="mt-2 text-center">Loading...</div>}
                        {geminiError && <div className="mt-2 p-2 bg-red-900/50 text-red-400 rounded">{geminiError}</div>}
                        {geminiResponse && (
                          <div className="mt-2 bg-gray-700 rounded p-2 space-y-2">
                            <div>
                              <h3 className="font-bold">Summary:</h3>
                              <p className="text-sm">{geminiResponse.summary}</p>
                            </div>
                            <div>
                              <h3 className="font-bold">New Code:</h3>
                              <pre className="bg-gray-800 border border-gray-600 rounded p-2 text-sm overflow-auto max-h-32">
                                <code>{geminiResponse.newCode}</code>
                              </pre>
                            </div>
                            <button
                              onClick={handleAcceptCode}
                              className="w-full bg-green-600 hover:bg-green-700 py-2 rounded transition"
                            >
                              Accept Code
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
          )}
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Share Project</h2>

              {shareUrl ? (
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Anyone with this link can view your project:
                  </p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    />
                    <button
                      onClick={copyShareUrl}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded transition flex items-center space-x-1"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Generate a shareable link for this project:
                  </p>
                  <button
                    onClick={generateShareToken}
                    className="w-full bg-green-600 hover:bg-green-700 py-2 rounded transition"
                  >
                    Generate Share Link
                  </button>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}