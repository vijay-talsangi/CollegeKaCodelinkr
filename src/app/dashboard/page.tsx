'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Submission {
  id: string;
  code: string;
  language: string;
  commit_message: string;
  ai_marks: number | null;
  professor_marks: number | null;
  remarks: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  batches: {
    name: string;
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchSubmissions();
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
        router.push('/login');
        return;
      }
      setUser(data.user);
    } catch {
      router.push('/login');
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'reviewed':
        return 'text-blue-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-white">DSA IDE</h1>
            <div className="flex items-center gap-4">
              <span className="text-slate-300">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">My Dashboard</h2>
          <Link
            href="/ide/new"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            New Code
          </Link>
        </div>

        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-xl font-semibold text-white">My Submissions</h3>
          </div>

          {submissions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-400 text-lg">No submissions yet</p>
              <Link
                href="/ide/new"
                className="inline-block mt-4 text-blue-400 hover:text-blue-300"
              >
                Create your first code
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Commit Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      AI Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Prof. Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {submission.batches.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {submission.language}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">
                        {submission.commit_message || 'No message'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {submission.ai_marks !== null ? `${submission.ai_marks}/10` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {submission.professor_marks !== null
                          ? `${submission.professor_marks}/10`
                          : '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {submissions.length > 0 && (
          <div className="mt-8 bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Submission Details</h3>
            {submissions.map((submission) => (
              <div key={submission.id} className="mb-6 pb-6 border-b border-slate-700 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-medium">
                      {submission.batches.name} - {submission.language}
                    </p>
                    <p className="text-sm text-slate-400">
                      {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
                {submission.remarks && (
                  <div className="mt-3 p-3 bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-300">{submission.remarks}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
