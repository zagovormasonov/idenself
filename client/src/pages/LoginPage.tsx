import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      login(response.data.access_token, response.data.user);
      navigate('/');
    } catch (err) {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-white">С возвращением</h2>
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Email</label>
            <input
              type="email"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Пароль</label>
            <input
              type="password"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-white text-navy p-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-white/50 transition-all transform hover:scale-[1.02]">
            Войти
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/60">
          Нет аккаунта? <Link to="/register" className="text-white font-semibold hover:underline">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
};

