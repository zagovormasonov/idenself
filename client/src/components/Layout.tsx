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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      <header className="bg-navy/50 backdrop-blur-sm border-b border-white/10 p-4 flex justify-between items-center z-10">
        <Link to="/" className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent tracking-tight">IdenSelf</Link>
        <nav>
            {user ? (
                <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-white/80 hidden sm:block">{user.email}</span>
                    <button onClick={handleLogout} className="text-sm font-medium text-white/80 hover:text-white transition-colors">Выйти</button>
                </div>
            ) : (
                <div className="flex items-center gap-6">
                     <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Войти</Link>
                     <Link to="/register" className="px-4 py-2 bg-gradient-brand text-navy font-semibold rounded-lg text-sm hover:shadow-lg hover:shadow-primary/50 transition-all">Начать</Link>
                </div>
            )}
        </nav>
      </header>
      <main className="flex-grow p-6 container mx-auto max-w-5xl">
        <Outlet />
      </main>
      <footer className="p-6 text-center text-white/40 text-xs mt-auto">
        © 2025 IdenSelf. Все права защищены.
      </footer>
    </div>
  );
};

