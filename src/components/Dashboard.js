import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  PieChart, Pie, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer 
} from 'recharts';
import { Link } from 'react-router-dom';
import { supabase, getCurrentUser } from '../supabaseClient';
import { useDarkMode } from './Layout';

const Dashboard = () => {
  console.log('Rendering Dashboard component');
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [savings, setSavings] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  const { darkMode, setDarkMode } = useDarkMode();

  // Get current user on component mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
        } else {
          setError('User not authenticated. Please log in.');
        }
      } catch (err) {
        console.error('Error getting user:', err);
        setError('Authentication error. Please try logging in again.');
      }
    };
    
    getUser();
  }, []);

  // Fetch avatar URL
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        if (data) setAvatarUrl(data.avatar_url);
      } catch (err) {
        console.error('Error fetching avatar:', err);
      }
    };
    fetchAvatar();
  }, []);

  // Memoize fetchData with useCallback
  const fetchData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 5);
      
      const { data, error } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      // --- Default months for the last 6 months ---
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      // --- Build monthlyData with zeros ---
      const monthlyData = {};
      months.forEach(month => {
        monthlyData[month] = { income: 0, expense: 0, savings: 0, sadaqah: 0 };
      });

      const categoryData = {
        income: {},
        expense: {},
        savings: {},
        sadaqah: {}
      };

      data.forEach(entry => {
        const date = new Date(entry.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { income: 0, expense: 0, savings: 0, sadaqah: 0 };
        }
        monthlyData[monthYear][entry.type] += entry.amount;
        
        if (!categoryData[entry.type][entry.category]) {
          categoryData[entry.type][entry.category] = 0;
        }
        categoryData[entry.type][entry.category] += entry.amount;
      });

      // Convert to arrays for charts
      const chartData = months.map(month => ({
        month,
        ...monthlyData[month]
      }));

      const categoryChartData = Object.entries(categoryData).map(([type, categories]) => ({
        type,
        data: Object.entries(categories).map(([category, amount]) => ({
          name: category,
          value: amount
        }))
      }));

      setChartData(chartData);
      setCategoryData(categoryChartData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [userId]); // Only depend on userId

  // Fetch data when userId changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    console.log('Dashboard: loading state');
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    console.log('Dashboard: error state', error);
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  console.log('Dashboard: rendering main content', { chartData, categoryData });
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-gray-200 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="p-2 bg-gray-200 rounded-full relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={() => setDarkMode && setDarkMode((prev) => !prev)}
            className="p-2 bg-gray-200 rounded-full dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors shadow"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
              </svg>
            )}
          </button>
          <Link to="/profile" className="h-12 w-12 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Total Income</h3>
            <span className="p-2 bg-green-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${chartData.reduce((sum, item) => sum + item.income, 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Last 6 months</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Total Expenses</h3>
            <span className="p-2 bg-red-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${chartData.reduce((sum, item) => sum + item.expense, 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Last 6 months</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Total Savings</h3>
            <span className="p-2 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${chartData.reduce((sum, item) => sum + item.savings, 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Last 6 months</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Total Sadaqah</h3>
            <span className="p-2 bg-purple-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ${chartData.reduce((sum, item) => sum + item.sadaqah, 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Last 6 months</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10B981" name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" name="Expenses" />
                <Line type="monotone" dataKey="savings" stroke="#3B82F6" name="Savings" />
                <Line type="monotone" dataKey="sadaqah" stroke="#8B5CF6" name="Sadaqah" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Category Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    ...((categoryData.find(d => d.type === 'expense')?.data) || []),
                    ...((categoryData.find(d => d.type === 'sadaqah')?.data) || [])
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#EF4444"
                  label
                >
                  {[
                    ...((categoryData.find(d => d.type === 'expense')?.data) || []),
                    ...((categoryData.find(d => d.type === 'sadaqah')?.data) || [])
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 