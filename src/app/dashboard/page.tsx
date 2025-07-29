'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, Code, Calendar, Share, Trash2, Edit } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { createSupabaseClientWithToken } from '@/lib/supabaseClientWithToken';
import { useCallback } from 'react';



type Project = {
  id: string;
  title: string;
  language: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  share_token: string | null;
};

export default function Dashboard() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectLanguage, setNewProjectLanguage] = useState('javascript');
  const { getToken } = useAuth();

  

  const fetchProjects = useCallback(async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      const supabaseWithAuth = createSupabaseClientWithToken(token!);
      const { data, error } = await supabaseWithAuth
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, user?.id]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  const createProject = async () => {
    if (!newProjectTitle.trim()) {
      alert('Project title cannot be empty');
      return;
    }

    try {
      const token = await getToken({ template: 'supabase' });
      const supabaseWithAuth = createSupabaseClientWithToken(token!);
      const { data, error } = await supabaseWithAuth
        .from('projects')
        .insert({
          title: newProjectTitle,
          language: newProjectLanguage,
          user_id: user?.id,
          code: getDefaultCode(newProjectLanguage),
          version: getDefaultVersion(newProjectLanguage),
        })
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setShowNewProject(false);
      setNewProjectTitle('');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const getDefaultCode = (language: string) => {
    const defaults: Record<string, string> = {
      javascript: `// Welcome to DSA IDE!\nconsole.log("Hello, World!");`,
      python: `# Welcome to DSA IDE!\nprint("Hello, World!")`,
      'c++': `// Welcome to DSA IDE!\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      java: `// Welcome to DSA IDE!\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
    };
    return defaults[language] || defaults.javascript;
  };

  const getDefaultVersion = (language: string) => {
    const defaults: Record<string, string> = {
      javascript: `18.15.0`,
      python: `3.10.0`,
      'c++': `10.2.0`,
      java: `15.0.2`
    };
    return defaults[language] || defaults.javascript;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-blue-400" />
            <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition">
              Codelinkr
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, {user?.firstName}!</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-gray-400">Manage your coding projects and collaborate with others</p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition"
          >
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </button>
        </div>

        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Project</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Title</label>
                  <input
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    placeholder="Enter project title"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select
                    value={newProjectLanguage}
                    onChange={(e) => setNewProjectLanguage(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="c++">C++</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Version</label>
                  <input
                    type="text"
                    value={getDefaultVersion(newProjectLanguage)}
                    readOnly
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
                  disabled={!newProjectTitle.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Code className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">Create your first project to get started</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className="min-w-0">
                     <h3 className="text-lg font-semibold break-words">{project.title}</h3>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <Link
                      href={`/ide/${project.id}`}
                      className="text-blue-400 hover:text-blue-300 transition"
                      title="Edit project"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="text-red-400 hover:text-red-300 transition"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-400 flex-grow">
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span className="capitalize">{project.language}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {formatDate(project.updated_at)}</span>
                  </div>
                  {project.is_public && (
                    <div className="flex items-center space-x-2">
                      <Share className="h-4 w-4" />
                      <span>Public</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <Link
                    href={`/ide/${project.id}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-center py-2 rounded transition"
                  >
                    Open Project
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}