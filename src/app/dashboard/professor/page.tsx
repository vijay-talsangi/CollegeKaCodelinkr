'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  prn: string;
  roll_number: string;
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
  students: {
    prn: string;
    roll_number: string;
    users: {
      name: string;
      email: string;
    };
  };
}

export default function ProfessorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [professorMarks, setProfessorMarks] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchBatches();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchStudents(selectedBatch.id);
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (selectedStudent && selectedBatch) {
      fetchSubmissions(selectedStudent.id, selectedBatch.id);
    }
  }, [selectedStudent, selectedBatch]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      if (data.user.role !== 'professor') {
        router.push('/login');
        return;
      }
      setUser(data.user);
    } catch {
      router.push('/login');
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/professor/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (batchId: string) => {
    try {
      const response = await fetch(`/api/professor/students?batchId=${batchId}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchSubmissions = async (studentId: string, batchId: string) => {
    try {
      const response = await fetch(`/api/submissions?studentId=${studentId}&batchId=${batchId}`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleSaveGrading = async () => {
    if (!selectedSubmission) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/submissions/${selectedSubmission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professorMarks: professorMarks ? parseInt(professorMarks) : null,
          remarks,
          status: status || selectedSubmission.status,
        }),
      });

      if (response.ok) {
        alert('Grading saved successfully');
        if (selectedStudent && selectedBatch) {
          fetchSubmissions(selectedStudent.id, selectedBatch.id);
        }
        setSelectedSubmission(null);
      } else {
        alert('Failed to save grading');
      }
    } catch (error) {
      console.error('Error saving grading:', error);
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const openSubmissionModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setProfessorMarks(submission.professor_marks?.toString() || '');
    setRemarks(submission.remarks || '');
    setStatus(submission.status);
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
            <h1 className="text-xl font-bold text-white">Professor Dashboard</h1>
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
        <h2 className="text-3xl font-bold text-white mb-8">My Batches</h2>

        {batches.length === 0 ? (
          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-12 text-center">
            <p className="text-slate-400 text-lg">No batches assigned</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {batches.map((batch) => (
              <button
                key={batch.id}
                onClick={() => {
                  setSelectedBatch(batch);
                  setSelectedStudent(null);
                  setStudents([]);
                  setSubmissions([]);
                }}
                className={`p-6 rounded-xl shadow-lg border transition-all text-left ${
                  selectedBatch?.id === batch.id
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <h3 className="text-xl font-semibold text-white mb-2">{batch.name}</h3>
                <p className="text-slate-300 text-sm">{batch.description || 'No description'}</p>
              </button>
            ))}
          </div>
        )}

        {selectedBatch && (
          <>
            <h3 className="text-2xl font-bold text-white mb-4">
              Students in {selectedBatch.name}
            </h3>

            {students.length === 0 ? (
              <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-8 text-center mb-8">
                <p className="text-slate-400">No submissions yet in this batch</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      selectedStudent?.id === student.id
                        ? 'bg-green-600 border-green-500'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-white font-medium">{student.name}</p>
                    <p className="text-slate-300 text-sm">{student.prn}</p>
                    <p className="text-slate-400 text-xs">{student.email}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {selectedStudent && submissions.length > 0 && (
          <>
            <h3 className="text-2xl font-bold text-white mb-4">
              Submissions by {selectedStudent.name}
            </h3>

            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Language
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Commit Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        AI Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Prof. Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {submission.status}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => openSubmissionModal(submission)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
              <h3 className="text-2xl font-bold text-white">Review Submission</h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Code</h4>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 border border-slate-700">
                  <code>{selectedSubmission.code}</code>
                </pre>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    AI Marks
                  </label>
                  <input
                    type="text"
                    value={
                      selectedSubmission.ai_marks !== null
                        ? `${selectedSubmission.ai_marks}/10`
                        : 'Not evaluated'
                    }
                    readOnly
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Professor Marks (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={professorMarks}
                    onChange={(e) => setProfessorMarks(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add your feedback..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrading}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Grading'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
