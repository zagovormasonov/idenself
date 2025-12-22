import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const ComplaintPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/survey/start');
      navigate(`/symptoms/${response.data.sessionId}`);
    } catch (error) {
      console.error('Не удалось начать опрос', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center text-white/60 hover:text-white mb-6 transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад
      </button>
      <h2 className="text-4xl font-bold mb-6 text-white">Начнем оценку</h2>
      <p className="mb-8 text-white/80 text-lg leading-relaxed">
        Мы поможем вам лучше понять свое состояние. На следующем этапе вы сможете выбрать симптомы и описать свои проблемы.
      </p>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-white text-navy px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-white/50 transition-all disabled:opacity-50 disabled:hover:shadow-none transform hover:scale-105 disabled:hover:scale-100"
        >
          {loading ? 'Загрузка...' : 'Начать оценку'}
        </button>
      </div>
    </div>
  );
};

