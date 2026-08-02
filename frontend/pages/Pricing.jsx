/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CreditCard, CheckCircle2 } from 'lucide-react';
import { FaHardHat } from 'react-icons/fa';
import { motion } from 'framer-motion';

import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

export default function Pricing() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('LKR'); // LKR or USD
  const [formData, setFormData] = useState({
    orgName: '',
    ownerName: '',
    email: '',
  });
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const price = currency === 'LKR' ? 'Rs. 9,000' : '$27';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsPaying(true);
    
    // Generate a mock order/organization ID for this transaction
    const mockOrgId = "org_" + Math.random().toString(36).substr(2, 9);

    // Simulate a secure checkout process delay (Demo Mode Bypass)
    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
      
      // Proceed directly to registration after simulated success
      setTimeout(() => {
         navigate(`/register?org_id=${mockOrgId}&org_name=${encodeURIComponent(formData.orgName)}`);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0F1115] font-sans text-[#1D1D1F] dark:text-gray-200 selection:bg-[#E8A33D] selection:text-white transition-colors duration-300">
      <PublicNavbar />

      <div className="max-w-4xl mx-auto px-6 py-20 flex-grow w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif text-[#1D1D1F] dark:text-white mb-6 tracking-tight uppercase">Set up your organization</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">One-time payment for lifetime access to SiteWatchAI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-8 md:p-12 shadow-[0_4px_24px_rgb(0,0,0,0.02)] transition-colors duration-300 backdrop-blur-md">
          
          {/* Pricing Details */}
          <div className="border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/10 pb-8 md:pb-0 md:pr-12">
            <h2 className="text-2xl font-serif text-[#1D1D1F] dark:text-white mb-6 tracking-tight">Lifetime Access Plan</h2>
            
            <div className="flex gap-2 mb-8 bg-[#F8F9FA] dark:bg-black/30 border border-gray-100 dark:border-transparent p-1 w-fit">
              <button 
                onClick={() => setCurrency('LKR')}
                className={`px-4 py-2 text-sm font-semibold transition uppercase tracking-wider ${currency === 'LKR' ? 'bg-[#1D1D1F] text-white dark:bg-[#E8A33D] dark:text-black shadow-sm' : 'text-gray-500 hover:text-[#1D1D1F] dark:text-gray-400 dark:hover:text-white'}`}
              >
                LKR (Rs)
              </button>
              <button 
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 text-sm font-semibold transition uppercase tracking-wider ${currency === 'USD' ? 'bg-[#1D1D1F] text-white dark:bg-[#E8A33D] dark:text-black shadow-sm' : 'text-gray-500 hover:text-[#1D1D1F] dark:text-gray-400 dark:hover:text-white'}`}
              >
                USD ($)
              </button>
            </div>

            <div className="mb-10">
              <span className="text-5xl font-serif text-[#1D1D1F] dark:text-white">{price}</span>
              <span className="text-gray-500 ml-2 font-medium">/ one-time</span>
            </div>

            <ul className="space-y-4 text-gray-600 dark:text-gray-300 text-sm">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-[#E8A33D] h-5 w-5" /> Unlimited Workers
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-[#E8A33D] h-5 w-5" /> Unlimited Projects
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-[#E8A33D] h-5 w-5" /> Real-time AI Monitoring
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-[#E8A33D] h-5 w-5" /> Custom Dashboards & Reports
              </li>
            </ul>
          </div>

          {/* Form */}
          <div>
            {!paymentSuccess ? (
              <form onSubmit={handlePayment} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Organization Name</label>
                  <input 
                    type="text" 
                    name="orgName"
                    required
                    value={formData.orgName}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 bg-[#F8F9FA] dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-gray-300 dark:focus:ring-[#E8A33D] focus:ring-1 focus:ring-gray-300 dark:focus:ring-2 outline-none transition text-[#1D1D1F] dark:text-white placeholder-gray-400"
                    placeholder="e.g. Apex Construction"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Owner Name</label>
                  <input 
                    type="text" 
                    name="ownerName"
                    required
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 bg-[#F8F9FA] dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-gray-300 dark:focus:ring-[#E8A33D] focus:ring-1 focus:ring-gray-300 dark:focus:ring-2 outline-none transition text-[#1D1D1F] dark:text-white placeholder-gray-400"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 bg-[#F8F9FA] dark:bg-black/50 border border-gray-200 dark:border-white/10 focus:border-gray-300 dark:focus:ring-[#E8A33D] focus:ring-1 focus:ring-gray-300 dark:focus:ring-2 outline-none transition text-[#1D1D1F] dark:text-white placeholder-gray-400"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="mt-8 p-5 border border-gray-200 dark:border-white/10 bg-[#F8F9FA] dark:bg-black/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Payment Details</span>
                    <CreditCard className="text-gray-400 dark:text-gray-500 h-5 w-5" />
                  </div>
                  <div className="text-xs text-[#E8A33D] mb-4 font-medium uppercase tracking-wide">
                    (Simulated Secure Checkout)
                  </div>
                  <input 
                    type="text" 
                    disabled
                    value="**** **** **** 4242"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-white/5 bg-white dark:bg-black/20 text-gray-400 dark:text-gray-500"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isPaying}
                  className={`w-full py-4 mt-6 text-white dark:text-black font-bold flex items-center justify-center gap-2 transition text-sm uppercase tracking-widest ${
                    isPaying ? 'bg-[#c49f2c] cursor-not-allowed text-white/50 dark:text-black/50' : 'bg-[#E8A33D] hover:bg-[#d99636]'
                  }`}
                >
                  {isPaying ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>Pay {price} & Setup Organization</>
                  )}
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="bg-[#E8A33D]/10 dark:bg-[#E8A33D]/20 p-5 rounded-full mb-6">
                  <CheckCircle2 className="h-16 w-16 text-[#E8A33D]" />
                </div>
                <h3 className="text-2xl font-serif text-[#1D1D1F] dark:text-white mb-3">Payment Successful!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your organization is ready. Redirecting you to complete registration...
                </p>
              </motion.div>
            )}
          </div>

        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
