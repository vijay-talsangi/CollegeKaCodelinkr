'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

// --- The Browser Mockup Frame Component ---
const BrowserFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-white/10 bg-gray-900/80 shadow-2xl shadow-blue-900/20">
    {/* Browser Header */}
    <div className="flex items-center gap-2 rounded-t-xl border-b border-white/10 bg-gray-800/80 px-4 py-3">
      <div className="h-3 w-3 rounded-full bg-red-500"></div>
      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
      <div className="h-3 w-3 rounded-full bg-green-500"></div>
    </div>
    {/* Image Content */}
    <div>{children}</div>
  </div>
);

// --- The Main Showcase Section ---
export default function ProductShowcase() {
  // We will apply these props directly to the motion components below
  // const animationProps = { ... }; // This object is no longer needed

  return (
    <div className="container mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          See Codelinkr in <span className="text-blue-400">Action</span>
        </h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          From managing projects on a sleek dashboard to writing code in a powerful, real-time IDE.
        </p>
      </div>

      <div className="grid gap-16 lg:gap-24">
        {/* Screenshot 1: Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <BrowserFrame>
            <Image
              src="/image_11e218.png"
              alt="Codelinkr Dashboard View"
              width={1500}
              height={750}
              className="rounded-b-lg"
            />
          </BrowserFrame>
        </motion.div>

        {/* Screenshot 2: IDE */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <BrowserFrame>
            <Image
              src="/image_11def4.png"
              alt="Codelinkr IDE View"
              width={1600}
              height={750}
              className="rounded-b-lg"
            />
          </BrowserFrame>
        </motion.div>
      </div>
    </div>
  );
}