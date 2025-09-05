'use client'; // <-- Add this at the very top

import { useState } from 'react'; // <-- Import useState
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs'; // <-- Import useUser hook
import Link from 'next/link';
import { Code, Users, Zap, Shield, Globe, Rocket, Coffee, Menu, X } from 'lucide-react'; // <-- Import Menu and X icons
import ProductShowcase from '@/components/ProductShowcase';

export default function Home() {
  const { user } = useUser(); // <-- Get user data with the hook
  const [isMenuOpen, setIsMenuOpen] = useState(false); // <-- State for the menu

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="relative flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Code className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-bold text-white">Codelinkr</span>
        </div>

        {/* Hamburger Button (Mobile Only) */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-7 w-7 text-white" /> : <Menu className="h-7 w-7 text-white" />}
          </button>
        </div>

        {/* Menu Links */}
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

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="w-full text-center bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition md:w-auto"
              >
                Dashboard
              </Link>
              <div className="mt-2 md:mt-0">
                <UserButton afterSignOutUrl="/" />
              </div>
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition md:w-auto">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition md:w-auto">
                  Get Started
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Code. Collaborate. <span className="text-blue-400">Create.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The ultimate online IDE for Data Structures and Algorithms with instant execution and sharing code link
          </p>
          {!user && (
            <SignUpButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-white text-lg font-semibold transition transform hover:scale-105">
                Start Coding for Free
              </button>
            </SignUpButton>
          )}
          {user && (
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-white text-lg font-semibold transition transform hover:scale-105"
            >
              Go to Dashboard
            </Link>
          )}
        </div>

        {/* Features Grid */}
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
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Collaboration</h3>
            <p className="text-gray-300">
              Share your projects with teammates and collaborate in real-time.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Shield className="h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
            <p className="text-gray-300">
              Your code is secure with enterprise-grade authentication and privacy controls for all your projects.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Globe className="h-12 w-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Share Anywhere</h3>
            <p className="text-gray-300">
              Generate shareable links for your projects with customizable permissions for viewing or editing.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Code className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Advanced Editor</h3>
            <p className="text-gray-300">
              VSCode editor with syntax highlighting, auto-completion, and debugging tools for a premium coding experience.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Rocket className="h-12 w-12 text-orange-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Always Free</h3>
            <p className="text-gray-300">
              Core features are completely free forever. No hidden costs, no execution limits for personal use.
            </p>
          </div>
        </div>

        <ProductShowcase />

        {/* CTA Section */}
        <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start coding?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join developers who trust Codelinkr for their coding projects.
          </p>
          {!user && (
            <SignUpButton mode="modal">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-lg text-white text-lg font-semibold transition transform hover:scale-105">
                Create Free Account
              </button>
            </SignUpButton>
          )}
        </div>
      </div>
    </main>
  );
}