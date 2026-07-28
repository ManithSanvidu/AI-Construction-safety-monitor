import React from 'react';
import { FaHardHat, FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="relative z-10 bg-[#0F1115] border-t border-white/10 pt-16 pb-8 text-gray-400 font-sans">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <FaHardHat className="text-[#E8A33D] h-6 w-6" />
              <span className="text-xl font-bold text-white tracking-tight">
                SiteWatch<span className="text-[#E8A33D]">AI</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Empowering construction sites with cutting-edge AI for proactive safety and real-time compliance.
            </p>
            <div className="flex items-center gap-4 text-white/50">
              <a href="#" className="hover:text-[#E8A33D] transition"><FaTwitter size={20} /></a>
              <a href="#" className="hover:text-[#E8A33D] transition"><FaLinkedin size={20} /></a>
              <a href="#" className="hover:text-[#E8A33D] transition"><FaGithub size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/features" className="hover:text-white transition">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><a href="#" className="hover:text-white transition">Case Studies</a></li>
              <li><a href="#" className="hover:text-white transition">Integrations</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 text-sm text-center md:text-left flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} SiteWatchAI. All rights reserved.</p>
          <p className="mt-4 md:mt-0">Built with safety in mind.</p>
        </div>
      </div>
    </footer>
  );
}
