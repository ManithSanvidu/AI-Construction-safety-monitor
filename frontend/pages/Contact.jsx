import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const response = await fetch('http://localhost:8000/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      setStatus('success');
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F1115] font-sans text-gray-200">
      <PublicNavbar />

      <main className="flex-grow max-w-[1200px] mx-auto px-8 py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-6">Get in Touch</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Have questions about setting up your organization or our enterprise plans? Our team is here to help you build safer sites.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-10 justify-center"
          >
            <div className="flex items-start gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <Mail className="text-[#E8A33D] h-8 w-8 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Email Us</h3>
                <p className="text-gray-400">safezoney91@gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <Phone className="text-[#E8A33D] h-8 w-8 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Call Us</h3>
                <p className="text-gray-400">+94-760429021</p>
                <p className="text-gray-400">Mon-Fri, 9am - 6pm EST</p>
              </div>
            </div>

            <div className="flex items-start gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <MapPin className="text-[#E8A33D] h-8 w-8 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Headquarters</h3>
                <p className="text-gray-400">224/3, Dambahena road<br/>Maharagama Sri Lanka</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <form className="bg-white/5 border border-white/10 p-10 rounded-3xl flex flex-col gap-6" onSubmit={handleSubmit}>
              {status === 'success' && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  Message sent successfully via WhatsApp!
                </div>
              )}
              {status === 'error' && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                  Failed to send message. Please try again.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe" 
                  className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#E8A33D] outline-none transition text-white placeholder-gray-600" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="john@company.com" 
                  className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#E8A33D] outline-none transition text-white placeholder-gray-600" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  placeholder="Pricing Inquiry" 
                  className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#E8A33D] outline-none transition text-white placeholder-gray-600" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea 
                  rows={5} 
                  required
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  placeholder="How can we help you?" 
                  className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#E8A33D] outline-none transition text-white placeholder-gray-600 resize-none"
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={status === 'loading'}
                className={`w-full py-4 rounded-xl font-bold mt-2 transition flex items-center justify-center gap-2 ${
                  status === 'loading' ? 'bg-[#b37c2b] text-black/50 cursor-not-allowed' : 'bg-[#E8A33D] hover:bg-[#d99636] text-black'
                }`}
              >
                {status === 'loading' ? 'Sending via WhatsApp...' : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
