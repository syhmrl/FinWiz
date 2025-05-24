import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Dark mode context
const DarkModeContext = createContext();
export const useDarkMode = () => useContext(DarkModeContext);

const Layout = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for dark mode preference
    return localStorage.getItem('finwiz-dark') === 'true';
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('finwiz-dark', darkMode);
  }, [darkMode]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-[#0BCDAA] to-[#05A6D4] text-white shadow-2xl flex flex-col">
          {/* Logo/Branding */}
          <div className="p-6 flex items-center gap-3 border-b border-[#05A6D4]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5a1 1 0 100 2 1 1 0 000-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            <h2 className="text-2xl font-bold tracking-tight">FinWiz</h2>
          </div>
          <nav className="flex-1 mt-6 flex flex-col gap-2">
            <ul className="flex-1 flex flex-col gap-1">
              <li className={`flex items-center ${currentPath === '/dashboard' ? 'bg-[#05A6D4] border-l-4 border-[#0BCDAA]' : 'hover:bg-[#05A6D4]/80'} py-3 px-6 rounded-r-lg transition-all` }>
                <Link to="/dashboard" className="flex items-center gap-3 w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <span className="font-medium text-lg">Dashboard</span>
                </Link>
              </li>
              <li className={`flex items-center ${currentPath === '/transactions' ? 'bg-[#05A6D4] border-l-4 border-[#0BCDAA]' : 'hover:bg-[#05A6D4]/80'} py-3 px-6 rounded-r-lg transition-all` }>
                <Link to="/transactions" className="flex items-center gap-3 w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M3 8v7a2 2 0 002 2h10a2 2 0 002-2V8H3zm3 2a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-lg">Budget Management</span>
                </Link>
              </li>
              <li className={`flex items-center ${currentPath === '/student-loan-calculator' ? 'bg-[#05A6D4] border-l-4 border-[#0BCDAA]' : 'hover:bg-[#05A6D4]/80'} py-3 px-6 rounded-r-lg transition-all` }>
                <Link to="/student-loan-calculator" className="flex items-center gap-3 w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M3 8v7a2 2 0 002 2h10a2 2 0 002-2V8H3zm3 2a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-lg">Student Loan Calculator</span>
                </Link>
              </li>
              <li className={`flex items-center ${currentPath === '/profile' ? 'bg-[#05A6D4] border-l-4 border-[#0BCDAA]' : 'hover:bg-[#05A6D4]/80'} py-3 px-6 rounded-r-lg transition-all` }>
                <Link to="/profile" className="flex items-center gap-3 w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-lg">Profile</span>
                </Link>
              </li>
            </ul>
            <div className="border-t border-[#05A6D4] mt-6 pt-4 flex flex-col gap-2">
              {/* Profile/avatar can be placed here if needed */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full text-left py-3 px-6 rounded-r-lg text-red-300 hover:text-white hover:bg-red-600 transition-all font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v3a1 1 0 102 0V9z" clipRule="evenodd" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </DarkModeContext.Provider>
  );
};

export default Layout; 