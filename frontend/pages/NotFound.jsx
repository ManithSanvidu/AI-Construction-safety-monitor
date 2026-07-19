import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
      <h1 className="text-4xl font-bold text-[#1d1d1f] mb-4">404 - Page Not Found</h1>
      <p className="text-gray-500 mb-6">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="px-6 py-3 bg-[#0066CC] text-white rounded-xl font-medium hover:bg-[#0055AA] transition-colors">
        Return Home
      </Link>
    </div>
  );
};

export default NotFound;
