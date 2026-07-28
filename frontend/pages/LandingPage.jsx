import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Bell, 
  BarChart3, 
  Cloud, 
  Users,
  Building2
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
    <div className="min-h-screen bg-[#0F1115] font-sans text-gray-200 selection:bg-[#E8A33D] selection:text-black">
      
      {/* Background Image Setup */}
      <div 
        className="fixed inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />
      {/* Gradient Overlay for text readability */}
      <div className="fixed inset-0 z-0 bg-gradient-to-r from-[#0F1115] via-[#0F1115]/90 to-transparent pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#0F1115] via-transparent to-transparent pointer-events-none" />


      {/* Navigation */}
      <PublicNavbar />

      {/* Main Hero Content */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-8 pt-20 pb-32">
        <div className="max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[4rem] leading-[1.1] font-bold text-white mb-6 tracking-tight"
          >
            Smarter Sites. <br />
            Safer Workers. <br />
            <span className="text-[#E8A33D]">Stronger Projects.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-gray-400 mb-10 max-w-xl leading-relaxed"
          >
            SiteWatchAI uses advanced AI to monitor construction sites in real time, detect risks, and ensure safety compliance—so you can build with confidence.
          </motion.p>

          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            onClick={() => navigate('/pricing')}
            className="bg-[#E8A33D] hover:bg-[#d99636] text-black font-semibold py-4 px-8 rounded-xl flex items-center gap-3 transition-transform hover:scale-105 shadow-[0_0_20px_rgba(232,163,61,0.3)] mb-10"
          >
            <ShieldCheck className="h-5 w-5" />
            AI-Powered Construction Monitoring
          </motion.button>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex items-center gap-8 text-sm font-medium text-gray-300"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-400" /> Real-time Detection
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-green-400" /> Instant Alerts
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-400" /> Actionable Insights
            </div>
          </motion.div>
        </div>
      </main>

      {/* Bottom Features Glass Bar */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-8 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          <div className="flex items-start gap-4">
            <div className="mt-1">
              <ShieldCheck className="h-8 w-8 text-[#E8A33D]" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Boost Site Safety</h4>
              <p className="text-xs text-gray-400">Detect hazards and prevent incidents before they happen.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1">
              <Users className="h-8 w-8 text-[#E8A33D]" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Ensure Compliance</h4>
              <p className="text-xs text-gray-400">Stay compliant with safety regulations and standards.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1">
              <Cloud className="h-8 w-8 text-[#E8A33D]" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Cloud-Based Platform</h4>
              <p className="text-xs text-gray-400">Access your site data anytime, anywhere.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1">
              <BarChart3 className="h-8 w-8 text-[#E8A33D]" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Data-Driven Decisions</h4>
              <p className="text-xs text-gray-400">Get detailed reports and insights to improve productivity.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Static CTA Section */}
      <div className="relative z-10 flex justify-center py-24 px-8 border-t border-white/5 bg-[#0F1115]/50 backdrop-blur-sm">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/pricing')}
          className="bg-[#E8A33D] hover:bg-[#d99636] text-black font-bold py-5 px-12 rounded-full flex items-center gap-3 shadow-[0_10px_30px_rgba(232,163,61,0.4)] transition-all text-lg"
        >
          <Building2 className="h-6 w-6" />
          Set up your organization
        </motion.button>
      </div>

      <PublicFooter />
    </div>
  );
}
