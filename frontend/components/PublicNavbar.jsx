import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FaHardHat } from 'react-icons/fa';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/features', label: 'Features' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' }
  ];

  return (
    <nav className="relative z-50 w-full flex items-center justify-between px-8 py-6 max-w-[1400px] mx-auto border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#0F1115] transition-colors duration-300">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <FaHardHat className="text-[#E8A33D] h-8 w-8" />
        <span className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
          SiteWatch<span className="text-[#E8A33D]">AI</span>
        </span>
      </div>
      <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            to={link.path} 
            className={`transition ${location.pathname === link.path ? 'text-[#1d1d1f] dark:text-white border-b-2 border-[#E8A33D] pb-1' : 'text-gray-500 dark:text-gray-400 hover:text-[#1d1d1f] dark:hover:text-white'}`}
          >
            {link.label}
          </Link>
        ))}
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition text-gray-500 dark:text-gray-400"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </nav>
  );
}
