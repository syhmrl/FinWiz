import React from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
// Uncomment these imports
import logo from './logo.svg';
import { supabase } from './supabaseClient';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute>
          <Layout>
            <Transactions />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
