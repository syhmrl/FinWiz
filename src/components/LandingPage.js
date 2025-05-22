import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/dashboard');
  };

  const handleLogin = () => {
    // In a real app, you would navigate to the login page
    // For now, we'll just go to the dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-5xl font-extrabold text-blue-700 mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5a1 1 0 100 2 1 1 0 000-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
        FinWiz
      </div>
      <p className="text-lg text-gray-700 mb-12 text-center max-w-lg">
        Manage your finances. Calculate your student loans. Visualize your progress.
      </p>
      
      <div className="flex gap-6">
        <button 
          onClick={() => navigate('/signup')}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
        >
          Sign Up Now
        </button>
        <button 
          onClick={handleLogin}
          className="px-8 py-3 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
        >
          Login
        </button>
      </div>
      
      <div className="mt-20 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} FinWiz. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LandingPage; 