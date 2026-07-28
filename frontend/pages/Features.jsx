import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Bell, BarChart3, Camera, Activity, FileWarning } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

export default function Features() {
  const features = [
    {
      icon: <Camera className="h-8 w-8 text-[#E8A33D]" />,
      title: "Real-Time PPE Detection",
      desc: "Instantly identify workers without hard hats, vests, or safety goggles using advanced computer vision."
    },
    {
      icon: <Bell className="h-8 w-8 text-[#E8A33D]" />,
      title: "Automated Alerting",
      desc: "Receive instant notifications via SMS or email when a severe safety violation is detected on any of your sites."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-[#E8A33D]" />,
      title: "Comprehensive Analytics",
      desc: "Generate detailed safety reports, track incident trends, and measure compliance rates over time."
    },
    {
      icon: <Activity className="h-8 w-8 text-[#E8A33D]" />,
      title: "Zone Intrusion",
      desc: "Set up virtual perimeters around hazardous areas and alert supervisors if unauthorized personnel enter."
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-[#E8A33D]" />,
      title: "Compliance Logs",
      desc: "Automatically maintain a digital log of all safety checks to easily satisfy regulatory audits."
    },
    {
      icon: <FileWarning className="h-8 w-8 text-[#E8A33D]" />,
      title: "Incident Playback",
      desc: "Review recorded video snippets of safety violations to help train staff and prevent future occurrences."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0F1115] font-sans text-gray-200">
      <PublicNavbar />

      <main className="flex-grow max-w-[1400px] mx-auto px-8 py-20 text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-white mb-6">Powerful AI Features</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-16">
            Discover the powerful AI-driven capabilities that keep your construction sites safe, compliant, and efficient.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors duration-300"
            >
              <div className="mb-6 bg-black/30 p-4 rounded-full inline-block">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
