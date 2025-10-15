'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Batch {
  id: string;
  name: string;
  description: string;
  professor_name: string;
}

export default function NewIDEPage() {
  const router = useRouter();
  const [, setUser] = useState<User | null>(null);
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello World");');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showTurnInModal, setShowTurnInModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchBatches();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      if (data.user.role !== 'student') {
        router.push('/dashboard/professor');
        return;
      }
      setUser(data.user);
    } catch {
      router.push('/login');
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          version: getLanguageVersion(language),
          stdin: input,
        }),
      });
      const data = await res.json();
      setOutput(data.output || data.error || 'No output');
    } catch (error) {
      setOutput('Error executing code');
      console.error('Execution error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageVersion = (lang: string) => {
    const versions: Record<string, string> = {
      javascript: '18.15.0',
      python: '3.10.0',
      'c++': '10.2.0',
      java: '15.0.2',
      c: '10.2.0',
    };
    return versions[lang] || '18.15.0';
  };

  const handleTurnIn = async () => {
    if (!selectedBatch) {
      alert('Please select a batch');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatch,
          code,
          language,
          commitMessage,
        }),
      });

      if (response.ok) {
        alert('Code submitted successfully!');
        setShowTurnInModal(false);
        setSelectedBatch('');
        setCommitMessage('');
        router.push('/dashboard');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit code');
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      alert('An error occurred while submitting');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
            <h1 className="text-xl font-bold text-white">Code Editor</h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="c++">C++</option>
              <option value="java">Java</option>
              <option value="c">C</option>
            </select>
            <button
              onClick={handleRun}
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Code'}
            </button>
            <button
              onClick={() => setShowTurnInModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Turn In
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        <div className="w-1/3 flex flex-col border-l border-slate-700">
          <div className="flex-1 flex flex-col">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
              <h3 className="text-white font-medium">Input</h3>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-900 text-white p-4 font-mono text-sm focus:outline-none resize-none"
              placeholder="Enter input for your program..."
            />
          </div>

          <div className="flex-1 flex flex-col border-t border-slate-700">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
              <h3 className="text-white font-medium">Output</h3>
            </div>
            <pre className="flex-1 bg-slate-900 text-white p-4 font-mono text-sm overflow-auto">
              {output || 'Run your code to see output here...'}
            </pre>
          </div>
        </div>
      </div>

      {showTurnInModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Turn In Assignment</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a batch...</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} - {batch.professor_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Commit Message (Optional)
                </label>
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your changes..."
                />
              </div>

              <div className="bg-slate-700 p-3 rounded-lg">
                <p className="text-sm text-slate-300">
                  <strong>Language:</strong> {language}
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  Your code will be evaluated automatically by AI, and your professor can review it later.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTurnInModal(false);
                  setSelectedBatch('');
                  setCommitMessage('');
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTurnIn}
                disabled={submitting || !selectedBatch}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
