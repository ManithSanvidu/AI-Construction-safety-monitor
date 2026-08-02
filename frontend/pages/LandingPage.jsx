import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Bell, 
  BarChart3, 
  Cloud, 
  Users,
  Building2,
  ArrowRight
} from 'lucide-react';
import { FaHardHat } from 'react-icons/fa';

import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showScrollCTA, setShowScrollCTA] = useState(false);

  // Handle scroll to show sticky CTA
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollCTA(true);
      } else {
        setShowScrollCTA(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F1115] font-sans text-[#1D1D1F] dark:text-gray-200 selection:bg-[#E8A33D] selection:text-white transition-colors duration-300">
      
      {/* Navigation */}
      <PublicNavbar />

      {/* Hero Image Block */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-4">
        <div 
          className="w-full h-[40vh] md:h-[55vh] bg-cover bg-center bg-no-repeat grayscale relative rounded-t-sm"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        >
           {/* Subtle gradient overlay to make the image slightly softer */}
           <div className="absolute inset-0 bg-black/10 dark:bg-black/40"></div>
        </div>
      </div>

      {/* Main Hero Content Block */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="bg-white dark:bg-white/5 px-8 md:px-16 py-12 md:py-20 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-white/10 flex flex-col md:flex-row justify-between items-start gap-12 backdrop-blur-md">
          
          <div className="max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-[3.5rem] md:text-[5.5rem] leading-[1.05] font-serif text-[#1D1D1F] dark:text-white mb-12 tracking-tight uppercase"
            >
              Smarter Sites.<br />
              Safer Workers.<br />
              <span className="text-[#E8A33D]">Stronger Projects.</span>
            </motion.h1>

            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              onClick={() => navigate('/pricing')}
              className="group border border-gray-300 dark:border-white/20 text-[#1D1D1F] dark:text-white hover:bg-[#1D1D1F] dark:hover:bg-white hover:text-white dark:hover:text-black text-xs font-semibold py-4 px-8 tracking-widest uppercase transition-all duration-300 flex items-center gap-3"
            >
              AI-Powered Construction Monitoring
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </div>

          <div className="md:max-w-xs md:pt-4">
             <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              SiteWatchAI uses advanced AI to monitor construction sites in real time, detect risks, and ensure safety compliance—so you can build with confidence.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-10 space-y-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[#E8A33D]" /> Real-time Detection
              </div>
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-[#E8A33D]" /> Instant Alerts
              </div>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-[#E8A33D]" /> Compliance Reports
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      {/* Features Section */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="bg-white dark:bg-white/5 p-8 border border-gray-100 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow">
            <ShieldCheck className="h-8 w-8 text-[#E8A33D] mb-5" />
            <h4 className="text-[#1D1D1F] dark:text-white font-serif text-xl mb-3 tracking-tight">Boost Site Safety</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Detect hazards and prevent incidents before they happen.</p>
          </div>
          <div className="bg-white dark:bg-white/5 p-8 border border-gray-100 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow">
            <Users className="h-8 w-8 text-[#E8A33D] mb-5" />
            <h4 className="text-[#1D1D1F] dark:text-white font-serif text-xl mb-3 tracking-tight">Ensure Compliance</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Stay compliant with safety regulations and standards.</p>
          </div>
          <div className="bg-white dark:bg-white/5 p-8 border border-gray-100 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow">
            <Cloud className="h-8 w-8 text-[#E8A33D] mb-5" />
            <h4 className="text-[#1D1D1F] dark:text-white font-serif text-xl mb-3 tracking-tight">Cloud Platform</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Access your site data anytime, anywhere.</p>
          </div>
          <div className="bg-white dark:bg-white/5 p-8 border border-gray-100 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow">
            <BarChart3 className="h-8 w-8 text-[#E8A33D] mb-5" />
            <h4 className="text-[#1D1D1F] dark:text-white font-serif text-xl mb-3 tracking-tight">Data Decisions</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Get detailed reports and insights to improve productivity.</p>
          </div>
        </motion.div>
      </div>

      {/* Static CTA Section */}
      <div className="relative z-10 flex flex-col items-center justify-center py-32 px-8 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F1115] transition-colors duration-300">
        <motion.h2 
           whileInView={{ opacity: 1, y: 0 }}
           initial={{ opacity: 0, y: 20 }}
           transition={{ duration: 0.6 }}
           className="text-3xl md:text-5xl font-serif text-[#1D1D1F] dark:text-white mb-12 text-center tracking-tight"
        >
          Ready to build with confidence?
        </motion.h2>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/pricing')}
          className="bg-[#E8A33D] hover:bg-[#d99636] text-white font-bold py-4 px-10 rounded-sm flex items-center gap-3 shadow-[0_10px_30px_rgba(232,163,61,0.3)] transition-all text-sm uppercase tracking-widest"
        >
          <Building2 className="h-5 w-5" />
          Set up your organization
        </motion.button>
      </div>

      <PublicFooter />
    </div>
  );
}
