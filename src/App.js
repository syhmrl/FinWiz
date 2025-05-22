import React, { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ExtendedProfile from './components/ExtendedProfile';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [profileCompleted, setProfileCompleted] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkProfileCompletion(session.user.id);
      } else {
        setProfileCompleted(false);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkProfileCompletion(session.user.id);
      } else {
        setProfileCompleted(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfileCompletion = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_completed')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfileCompleted(data?.profile_completed || false);
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setProfileCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          session ? (
            profileCompleted ? (
              <Layout />
            ) : (
              <Navigate to="/complete-profile" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
      </Route>

      {/* Extended Profile Route */}
      <Route
        path="/complete-profile"
        element={
          session ? (
            profileCompleted ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <ExtendedProfile />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
