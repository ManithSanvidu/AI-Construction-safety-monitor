import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Zap } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0F1115] font-sans text-[#1D1D1F] dark:text-gray-200 selection:bg-[#E8A33D] selection:text-white transition-colors duration-300">
      <PublicNavbar />

      <main className="flex-grow max-w-[1000px] mx-auto px-8 py-20 text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-serif text-[#1D1D1F] dark:text-white mb-6 tracking-tight uppercase">About SiteWatchAI</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-16 max-w-3xl mx-auto">
            We believe that every construction worker deserves to go home safely at the end of the day. 
            Our mission is to empower construction companies with cutting-edge artificial intelligence and computer vision 
            to proactively identify risks and enforce safety protocols on site.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow p-8 transition-colors duration-300"
          >
            <div className="mb-6 bg-[#F8F9FA] dark:bg-black/30 border border-gray-100 dark:border-transparent p-4 inline-block">
              <Target className="text-[#E8A33D] h-8 w-8" />
            </div>
            <h3 className="text-2xl font-serif text-[#1D1D1F] dark:text-white mb-3 tracking-tight">Our Mission</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              To drastically reduce workplace accidents by providing real-time, AI-powered monitoring solutions that are accessible and easy to deploy.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow p-8 transition-colors duration-300"
          >
            <div className="mb-6 bg-[#F8F9FA] dark:bg-black/30 border border-gray-100 dark:border-transparent p-4 inline-block">
              <Zap className="text-[#E8A33D] h-8 w-8" />
            </div>
            <h3 className="text-2xl font-serif text-[#1D1D1F] dark:text-white mb-3 tracking-tight">Innovation</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We leverage the latest in deep learning and edge computing to process video streams instantaneously without compromising privacy.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow p-8 transition-colors duration-300"
          >
            <div className="mb-6 bg-[#F8F9FA] dark:bg-black/30 border border-gray-100 dark:border-transparent p-4 inline-block">
              <Users className="text-[#E8A33D] h-8 w-8" />
            </div>
            <h3 className="text-2xl font-serif text-[#1D1D1F] dark:text-white mb-3 tracking-tight">Who We Are</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              A dedicated team of AI researchers, software engineers, and construction veterans united by a common goal to revolutionize site safety.
            </p>
          </motion.div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
