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
    const amount = currency === 'LKR' ? 9000 : 27;

    try {
      const response = await fetch('http://localhost:8000/api/payment/generate-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: mockOrgId,
          amount: amount,
          currency: currency
        })
      });
      const data = await response.json();

      if (!data.hash) throw new Error("Failed to generate payment hash");

      const amountFormatted = amount.toFixed(2);

      const payment = {
        sandbox: true,
        merchant_id: data.merchant_id,
        return_url: 'http://localhost:5173/pricing',
        cancel_url: 'http://localhost:5173/pricing',
        notify_url: 'http://localhost:8000/api/payment/notify',
        order_id: mockOrgId,
        items: 'SiteWatchAI Lifetime Access',
        amount: amountFormatted,
        currency: currency,
        hash: data.hash,
        first_name: formData.ownerName.split(' ')[0] || formData.ownerName,
        last_name: formData.ownerName.split(' ')[1] || '',
        email: formData.email,
        phone: '0771234567', // Placeholder
        address: 'No.1, Galle Road', // Placeholder
        city: 'Colombo',
        country: 'Sri Lanka',
      };

      window.payhere.onCompleted = function onCompleted(orderId) {
          setIsPaying(false);
          setPaymentSuccess(true);
          setTimeout(() => {
             navigate(`/register?org_id=${orderId}&org_name=${encodeURIComponent(formData.orgName)}`);
          }, 2000);
      };

      window.payhere.onDismissed = function onDismissed() {
          setIsPaying(false);
      };

      window.payhere.onError = function onError(error) {
          console.error("Payment Error:", error);
          setIsPaying(false);
          alert("Payment failed: " + error);
      };

      window.payhere.startPayment(payment);
    } catch (error) {
      console.error(error);
      setIsPaying(false);
      alert("Error initiating payment.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F1115] font-sans text-gray-200">
      <PublicNavbar />

      <div className="max-w-4xl mx-auto px-6 py-20 flex-grow">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Set up your organization</h1>
          <p className="text-gray-400">One-time payment for lifetime access to SiteWatchAI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md">
          
          {/* Pricing Details */}
          <div className="border-r border-white/10 pr-8">
            <h2 className="text-xl font-semibold text-white mb-6">Lifetime Access Plan</h2>
            
            <div className="flex gap-4 mb-8 bg-black/30 p-1 rounded-lg w-fit">
              <button 
                onClick={() => setCurrency('LKR')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${currency === 'LKR' ? 'bg-[#E8A33D] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                LKR (Rs)
              </button>
              <button 
                onClick={() => setCurrency('USD')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${currency === 'USD' ? 'bg-[#E8A33D] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                USD ($)
              </button>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-bold text-white">{price}</span>
              <span className="text-gray-400 ml-2">/ one-time</span>
            </div>

            <ul className="space-y-4 text-gray-300">
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
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Organization Name</label>
                  <input 
                    type="text" 
                    name="orgName"
                    required
                    value={formData.orgName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-[#E8A33D] outline-none transition text-white"
                    placeholder="e.g. Apex Construction"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Owner Name</label>
                  <input 
                    type="text" 
                    name="ownerName"
                    required
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-[#E8A33D] outline-none transition text-white"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-[#E8A33D] outline-none transition text-white"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="mt-6 p-4 border border-white/10 bg-black/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Payment Details</span>
                    <CreditCard className="text-gray-500 h-5 w-5" />
                  </div>
                  <div className="text-xs text-[#E8A33D] mb-3">
                    (Simulated Secure Checkout)
                  </div>
                  <input 
                    type="text" 
                    disabled
                    value="**** **** **** 4242"
                    className="w-full px-4 py-2 border border-white/5 rounded-lg bg-black/20 text-gray-500"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isPaying}
                  className={`w-full py-4 rounded-lg text-black font-bold flex items-center justify-center gap-2 transition ${
                    isPaying ? 'bg-[#b37c2b] cursor-not-allowed' : 'bg-[#E8A33D] hover:bg-[#d99636]'
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
                <div className="bg-[#E8A33D]/20 p-4 rounded-full mb-6">
                  <CheckCircle2 className="h-16 w-16 text-[#E8A33D]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                <p className="text-gray-400">
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
