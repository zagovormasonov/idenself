import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-surface shadow-sm p-4 flex justify-between items-center z-10">
        <Link to="/" className="text-2xl font-bold text-primary tracking-tight">MentalHealth<span className="font-light">AI</span></Link>
        <nav>
            {user ? (
                <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-secondary hidden sm:block">{user.email}</span>
                    <button onClick={handleLogout} className="text-sm font-medium text-secondary hover:text-primary transition-colors">Logout</button>
                </div>
            ) : (
                <div className="flex items-center gap-6">
                     <Link to="/login" className="text-sm font-medium text-secondary hover:text-primary transition-colors">Login</Link>
                     <Link to="/register" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all shadow-md">Get Started</Link>
                </div>
            )}
        </nav>
      </header>
      <main className="flex-grow p-6 container mx-auto max-w-5xl">
        <Outlet />
      </main>
      <footer className="p-6 text-center text-gray-400 text-xs mt-auto">
        © 2025 MentalHealthAI. All rights reserved.
      </footer>
    </div>
  );
};

