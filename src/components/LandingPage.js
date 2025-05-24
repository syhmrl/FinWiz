import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Lottie from 'lottie-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [bgAnimationData, setBgAnimationData] = useState(null);
  const [logoAnimationData, setLogoAnimationData] = useState(null);

  useEffect(() => {
    fetch('/background_animation.json')
      .then(response => response.json())
      .then(data => setBgAnimationData(data))
      .catch(error => console.error('Error loading background animation:', error));
    fetch('/finwiz_animation.json')
      .then(response => response.json())
      .then(data => setLogoAnimationData(data))
      .catch(error => console.error('Error loading logo animation:', error));
  }, []);

  const handleStart = () => {
    navigate('/dashboard');
  };

  const handleLogin = () => {
    navigate('/dashboard');
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center relative overflow-hidden p-0 m-0">
      {/* Full-viewport Lottie background */}
      {bgAnimationData && (
        <Lottie
          animationData={bgAnimationData}
          loop={true}
          autoplay={true}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            pointerEvents: 'none',
          }}
          rendererSettings={{
            preserveAspectRatio: 'none',
          }}
        />
      )}
      {/* Main content remains unchanged, above the animation */}
      <div className="relative z-10 bg-white bg-opacity-90 rounded-3xl shadow-2xl p-10 max-w-xl w-full flex flex-col items-center">
        <div className="mb-4 flex flex-col items-center">
          <div className="w-48 h-48">
            {logoAnimationData && (
              <Lottie
                animationData={logoAnimationData}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#05A6D4] mb-4 text-center drop-shadow">Welcome to FinWiz</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">Your all-in-one platform for student budgeting, loan management, and financial success.</p>
        <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
          <a href="/login" className="w-full md:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-[#0BCDAA] to-[#05A6D4] text-white font-bold text-lg shadow-lg hover:from-[#05A6D4] hover:to-[#0BCDAA] transition-all text-center">Login</a>
          <a href="/signup" className="w-full md:w-auto px-8 py-3 rounded-lg border-2 border-[#05A6D4] text-[#05A6D4] font-bold text-lg shadow-lg hover:bg-[#05A6D4] hover:text-white transition-all text-center">Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 