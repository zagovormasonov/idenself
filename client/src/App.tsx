import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ComplaintPage } from './pages/ComplaintPage';
import { SurveyPage } from './pages/SurveyPage';
import { ResultsPage } from './pages/ResultsPage';

// Placeholder for other pages
const HomePage = () => (
  <div className="text-center py-20">
    <h2 className="text-4xl font-bold mb-4 text-primary">Your Mental Health Journey Starts Here</h2>
    <p className="text-xl text-secondary mb-8 max-w-2xl mx-auto">
      Professional assessment powered by AI to help you understand yourself better.
    </p>
    <div className="flex justify-center mb-16">
        <a href="/complaint" className="bg-primary text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all shadow-lg">Start Assessment</a>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-12">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-2 text-primary">Describe</h3>
            <p className="text-gray-600">Tell us about your complaints in your own words.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-2 text-primary">Assess</h3>
            <p className="text-gray-600">Answer dynamic questions generated specifically for you.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg mb-2 text-primary">Understand</h3>
            <p className="text-gray-600">Get a detailed personal plan and professional guidance.</p>
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
            <Route path="survey/:id" element={<SurveyPage />} />
            <Route path="results/:id" element={<ResultsPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

