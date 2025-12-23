import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ComplaintPage } from './pages/ComplaintPage';
import { SymptomsPage } from './pages/SymptomsPage';
import { SurveyPage } from './pages/SurveyPage';
import { ResultsPage } from './pages/ResultsPage';
import { ProfilePage } from './pages/ProfilePage';

// Placeholder for other pages
const HomePage = () => (
  <div className="text-center py-20">
    <h2 className="text-5xl font-bold mb-6 text-white leading-tight">Ваш путь к себе начинается здесь</h2>
    <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
      Профессиональная оценка с использованием ИИ поможет вам лучше понять себя
    </p>
    <div className="flex justify-center mb-16">
        <a href="/complaint" className="bg-white text-navy px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-white/50 transition-all transform hover:scale-105">Начать оценку</a>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-12">
        <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
            <h3 className="font-semibold text-xl mb-3 text-white">Опишите</h3>
            <p className="text-white/70 leading-relaxed">Расскажите о своих жалобах своими словами</p>
        </div>
        <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
            <h3 className="font-semibold text-xl mb-3 text-white">Оцените</h3>
            <p className="text-white/70 leading-relaxed">Ответьте на динамические вопросы, созданные специально для вас</p>
        </div>
        <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
            <h3 className="font-semibold text-xl mb-3 text-white">Поймите</h3>
            <p className="text-white/70 leading-relaxed">Получите детальный личный план и профессиональное руководство</p>
        </div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="complaint" element={<ComplaintPage />} />
          <Route path="symptoms/:id" element={<SymptomsPage />} />
          <Route path="survey/:id" element={<SurveyPage />} />
          <Route path="results/:id" element={<ResultsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

