'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Code, Users, Zap, Shield, Globe, Rocket, Coffee, Menu, X } from 'lucide-react';
import ProductShowcase from '@/components/ProductShowcase';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (response.ok) {
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <nav className="relative flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Code className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-bold text-white">DSA IDE</span>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-7 w-7 text-white" /> : <Menu className="h-7 w-7 text-white" />}
          </button>
        </div>

        <div
          className={`
          ${isMenuOpen ? 'flex' : 'hidden'}
          absolute left-0 top-full w-full flex-col items-center gap-4 bg-gray-900/95 p-6 backdrop-blur-md
          md:static md:w-auto md:flex-row md:bg-transparent md:p-0 md:flex md:backdrop-blur-none
        `}
        >
          <Link
            href="/coffee"
            className="flex w-full justify-center items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg text-black font-medium transition md:w-auto"
          >
            <Coffee className="h-5 w-5" />
            <span>Buy Me a Tea</span>
          </Link>

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="w-full text-center bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition md:w-auto"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="w-full text-center bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition md:w-auto"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="w-full text-center bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition md:w-auto"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Code. Learn. <span className="text-blue-400">Excel.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The ultimate DSA IDE for students and professors with instant execution, AI evaluation, and comprehensive code review
          </p>
          {!isAuthenticated && (
            <Link
              href="/signup"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-white text-lg font-semibold transition transform hover:scale-105"
            >
              Start Coding for Free
            </Link>
          )}
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-white text-lg font-semibold transition transform hover:scale-105"
            >
              Go to Dashboard
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Zap className="h-12 w-12 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Instant Execution</h3>
            <p className="text-gray-300">
              Run your code instantly with support for multiple programming languages including Python, JavaScript, C++, and Java.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Users className="h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Student-Professor Flow</h3>
            <p className="text-gray-300">
              Students submit code to professors organized by batches for review and grading.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Shield className="h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Evaluation</h3>
            <p className="text-gray-300">
              Automatic code evaluation by AI with professor oversight for comprehensive feedback.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Globe className="h-12 w-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Share Anywhere</h3>
            <p className="text-gray-300">
              Generate shareable links for your projects with customizable permissions for viewing.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Code className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Advanced Editor</h3>
            <p className="text-gray-300">
              Monaco editor with syntax highlighting and auto-completion for a premium coding experience.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Rocket className="h-12 w-12 text-orange-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Role-Based Access</h3>
            <p className="text-gray-300">
              Separate workflows for students and professors with secure authentication.
            </p>
          </div>
        </div>

        <ProductShowcase />

        <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start coding?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join students and professors using DSA IDE for learning and teaching.
          </p>
          {!isAuthenticated && (
            <Link
              href="/signup"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-lg text-white text-lg font-semibold transition transform hover:scale-105"
            >
              Create Free Account
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
