import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      <header className="bg-navy/50 backdrop-blur-sm border-b border-white/10 p-4 flex justify-between items-center z-50 relative" ref={menuRef}>
        <Link to="/" className="text-2xl font-bold text-white tracking-tight" onClick={closeMobileMenu}>IdenSelf</Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden sm:block">
            {user ? (
                <div className="flex items-center gap-6">
                    <Link to="/profile" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Личный кабинет</Link>
                    <span className="text-sm font-medium text-white/80">{user.email}</span>
                    <button onClick={handleLogout} className="text-sm font-medium text-white/80 hover:text-white transition-colors">Выйти</button>
                </div>
            ) : (
                <div className="flex items-center gap-6">
                     <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Войти</Link>
                     <Link to="/register" className="px-4 py-2 bg-white text-navy font-semibold rounded-lg text-sm hover:shadow-lg hover:shadow-white/50 transition-all">Начать</Link>
                </div>
            )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-navy/95 backdrop-blur-xl border-b border-white/10 sm:hidden z-50">
            <div className="flex flex-col p-4 space-y-4">
              {user ? (
                <>
                  <div className="pb-3 border-b border-white/10">
                    <p className="text-xs text-white/60 mb-1">Вы вошли как</p>
                    <p className="text-sm font-medium text-white">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="text-base font-medium text-white/90 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                  >
                    Личный кабинет
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-base font-medium text-white/90 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10 text-left"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="text-base font-medium text-white/90 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                  >
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="bg-white text-navy font-semibold rounded-lg text-base py-2 px-4 text-center hover:shadow-lg hover:shadow-white/50 transition-all"
                  >
                    Начать
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
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

