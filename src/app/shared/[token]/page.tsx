'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { supabase } from '@/lib/supabase';
import { Code, Play, Eye, TestTube, ChevronDown, ChevronUp, TextCursorInput } from 'lucide-react';
import Link from 'next/link';
import { useCallback } from 'react';
import axios from 'axios';

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

type AnalysisParameter = {
  name: string;
  score: number;
  maxScore: number;
};

type CodeAnalysis = {
  purpose: string;
  quality: string;
  suggestions: string;
  parameters: AnalysisParameter[];
};


export default function SharedProjectPage() {
  const params = useParams();
  const token = params.token as string;

  const [project, setProject] = useState<Project | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [version, setVersion] = useState('');
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editorWidth, setEditorWidth] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [inspecting, setInspecting] = useState(false);

  // State for vertical panel resizing
  const [panelHeights, setPanelHeights] = useState([25, 45, 30]); // [input, output, inspector] percentages
  const [isDraggingPanel, setIsDraggingPanel] = useState<number | null>(null); // index of divider being dragged
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);

  // State for collapsible panels on mobile
  const [activeMobilePanel, setActiveMobilePanel] = useState<'input' | 'output' | 'gemini'>('input');

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

  const loadSharedProject = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('share_token', token)
        .eq('is_public', true)
        .single();

      if (error) {
        setError('Project not found or not publicly shared');
        setProjectLoading(false);
        return;
      }

      setProject(data);
      setCode(data.code);
      setLanguage(data.language);
      setVersion(data.version);
      setProjectLoading(false);
    } catch (error) {
      console.error('Error loading shared project:', error);
      setError('Failed to load project');
      setProjectLoading(false);
    }
  }, [token]);

  // Load project data
  useEffect(() => {
    if (token) {
      loadSharedProject();
    }
  }, [token, loadSharedProject]);

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

  const handleInspect = async () => {
    setInspecting(true);
    setAnalysis(null);
    try {
      const res = await axios.post('/api/inspector', { code, language });
      setAnalysis(res.data);
    } catch (error) {
      console.error('Error inspecting code:', error);
      // You might want to set an error state here to display to the user
    } finally {
      setInspecting(false);
    }
  };


  // Resizing logic
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
  },
    [isDragging, isMobile, containerRef]
  );

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
    } else if (isDraggingPanel === 1) { // Divider between Output and Code Inspector
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

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading shared project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error || 'Project not found'}</div>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Responsive layout values
  const editorStyle = {
    width: isMobile ? '100%' : `${editorWidth}%`,
    height: isMobile ? '50%' : '100%'
  };

  const panelStyle = {
    width: isMobile ? '100%' : `${100 - editorWidth}%`,
    height: isMobile ? '50%' : '100%'
  };

  const mobilePanelContent = (panel: 'input' | 'output' | 'gemini') => (
    <div className={`flex-1 overflow-y-auto p-4 ${activeMobilePanel === panel ? '' : 'hidden'}`}>
      {panel === 'input' && (
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm resize-none"
            placeholder="Enter input for your code here..."
          />
          <pre className="h-full bg-gray-800 border border-gray-700 rounded p-4 text-green-400 whitespace-pre-wrap overflow-auto text-sm">
            {output || 'Run the code to see output here.'}
          </pre>
        </div>
      )}
      {panel === 'gemini' && (
        <div className="space-y-2">
          <button
            onClick={handleInspect}
            className="w-full bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded flex items-center justify-center space-x-2 transition text-sm"
            disabled={inspecting}
          >
            <span>{inspecting ? 'Inspecting...' : 'Inspect Code'}</span>
          </button>

          {inspecting && <div className="mt-2 text-center">Analyzing code...</div>}
          {analysis && (
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <h3 className="font-bold text-teal-400">Purpose</h3>
                <p className="text-gray-300">{analysis.purpose}</p>
              </div>
              <div>
                <h3 className="font-bold text-teal-400">Quality</h3>
                <p className="text-gray-300">{analysis.quality}</p>
              </div>
              <div>
                <h3 className="font-bold text-teal-400">Suggestions</h3>
                <p className="text-gray-300">{analysis.suggestions}</p>
              </div>
              <div>
                <h3 className="font-bold text-teal-400 mb-2">Evaluation</h3>
                <div className="space-y-2">
                  {analysis.parameters.map(param => (
                    <div key={param.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{param.name}</span>
                        <span>{param.score} / 10</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-teal-500 h-2.5 rounded-full"
                          style={{ width: `${(param.score / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              <Code className="h-6 w-6 text-blue-400" />
              <div>
                <h1 className="text-xl font-semibold">{project.title}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Eye className="h-3 w-3" />
                  <span>Shared Project</span>
                  <span>•</span>
                  <span className="capitalize">{language}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleRun}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded flex items-center space-x-2 transition text-sm"
                disabled={loading}
              >
                <Play className="h-4 w-4" />
                <span>{loading ? 'Running...' : 'Run'}</span>
              </button>

              <Link
                href="/"
                className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm transition"
              >
                Create Your Own
              </Link>
            </div>
          </div>
        </header>

        <div className={`flex flex-1 ${isMobile ? 'flex-col' : 'flex-row'} overflow-hidden`}>
          {/* Left Panel - Code Editor (Read-only) */}
          <div
            className="relative"
            style={editorStyle}
          >
            <Editor
              height="100%"
              language={language === 'c++' ? 'cpp' : language}
              value={code}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                tabSize: 2,
                readOnly: true,
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

          {/* Right Panel - Output */}
          {isMobile ? (
            <div className="flex flex-col" style={panelStyle}>
              <div className="flex bg-gray-800 border-t border-gray-700">
                <button
                  onClick={() => setActiveMobilePanel('input')}
                  className={`flex-1 p-2 text-sm ${activeMobilePanel === 'input' ? 'bg-gray-900' : ''}`}
                >
                  Input/Output
                </button>
                <button
                  onClick={() => setActiveMobilePanel('gemini')}
                  className={`flex-1 p-2 text-sm ${activeMobilePanel === 'gemini' ? 'bg-gray-900' : ''}`}
                >
                  Inspector
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
              <div className="flex flex-col overflow-hidden" style={{ height: `${panelHeights[0]}%` }}>
                <h2 className="text-lg p-4 font-bold flex items-center space-x-2">
                  <TextCursorInput className="h-5 w-5" />
                  <span>Input</span>
                </h2>
                <div className="flex-1 p-4 pt-0">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full h-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm"
                    placeholder="Enter input for the code here..."
                  />
                </div>
              </div>

              <div
                className="h-2 w-full bg-gray-700 cursor-row-resize hover:bg-blue-500 active:bg-blue-600 transition-colors flex-shrink-0"
                onMouseDown={(e) => startPanelDrag(e, 0)}
              />

              {/* Output Section */}
              <div className="flex flex-col overflow-hidden" style={{ height: `${panelHeights[1]}%` }}>
                <h2 className="text-lg p-4 font-bold flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Output</span>
                </h2>
                <div className="flex-1 p-4 pt-0">
                  <pre className="h-full bg-gray-800 border border-gray-700 rounded p-4 text-green-400 whitespace-pre-wrap flex-1 overflow-auto text-sm">
                    {output || 'Run the code to see output here.'}
                  </pre>
                </div>
              </div>

              <div
                className="h-2 w-full bg-gray-700 cursor-row-resize hover:bg-blue-500 active:bg-blue-600 transition-colors flex-shrink-0"
                onMouseDown={(e) => startPanelDrag(e, 1)}
              />

              {/* Code Inspector Section */}
              <div className="flex flex-col overflow-hidden bg-gray-800" style={{ height: `${panelHeights[2]}%` }}>
                <div
                  className="p-4 flex justify-between items-center cursor-pointer flex-shrink-0"
                  onClick={() => setPanelHeights(panelHeights[2] > 10 ? [45, 45, 10] : [30, 30, 40])}
                >
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <TestTube className='w-5 h-5 text-teal-400'></TestTube>
                    <span>Code Inspector</span>
                  </h2>
                  {panelHeights[2] > 10 ? <ChevronDown /> : <ChevronUp />}
                </div>
                {panelHeights[2] > 10 && (
                  <div className="flex-1 p-4 pt-0 overflow-y-auto">
                    <button
                      onClick={handleInspect}
                      className="w-full bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded flex items-center justify-center space-x-2 transition text-sm"
                      disabled={inspecting}
                    >
                      <span>{inspecting ? 'Inspecting...' : 'Inspect Code'}</span>
                    </button>

                    {inspecting && <div className="mt-2 text-center">Analyzing code...</div>}

                    {analysis && (
                      <div className="mt-4 space-y-4 text-sm">
                        <div>
                          <h3 className="font-bold text-teal-400">Purpose</h3>
                          <p className="text-gray-300">{analysis.purpose}</p>
                        </div>
                        <div>
                          <h3 className="font-bold text-teal-400">Quality</h3>
                          <p className="text-gray-300">{analysis.quality}</p>
                        </div>
                        <div>
                          <h3 className="font-bold text-teal-400">Suggestions</h3>
                          <p className="text-gray-300">{analysis.suggestions}</p>
                        </div>
                        <div>
                          <h3 className="font-bold text-teal-400 mb-2">Evaluation</h3>
                          <div className="space-y-2">
                            {analysis.parameters.map(param => (
                              <div key={param.name}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{param.name}</span>
                                  <span>{param.score} / 10</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                  <div
                                    className="bg-teal-500 h-2.5 rounded-full"
                                    style={{ width: `${(param.score / 10) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>)}
        </div>
      </div>
    </main>
  );
}