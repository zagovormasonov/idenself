import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export const ResultsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plan');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`/api/survey/${id}`);
        const session = response.data;
        const resultQ = session.questionnaires.find((q: any) => q.type === 'RESULTS');
        if (resultQ) {
          setResults(resultQ.questions);
        }
      } catch (error) {
        console.error('Не удалось загрузить результаты', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-white text-xl">Анализ загружается...</div>;
  if (!results) return <div className="text-center py-20 text-white text-xl">Результаты не найдены.</div>;

  const tabLabels: Record<string, string> = {
    plan: 'Личный план',
    psychologist: 'Психолог',
    specialist: 'Специалист'
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center text-white/60 hover:text-white mb-6 transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        На главную
      </button>
      <h1 className="text-4xl font-bold mb-3 text-center text-white">Ваша оценка завершена</h1>
      <p className="text-center text-white/80 mb-12 text-lg">Вот ваша персонализированная оценка ментального здоровья</p>

      <div className="flex justify-center space-x-4 mb-8 border-b border-white/20 pb-1">
        {['plan', 'psychologist', 'specialist'].map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-6 font-medium text-lg transition-all border-b-2 ${
                    activeTab === tab 
                    ? 'border-white text-white' 
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
            >
                {tabLabels[tab]}
            </button>
        ))}
      </div>

      <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 min-h-[500px]">
        {activeTab === 'plan' && (
            <div className="prose prose-invert max-w-none text-white/90 whitespace-pre-wrap leading-relaxed">
                {results.personalPlan}
            </div>
        )}
        {activeTab === 'psychologist' && (
            <div className="prose prose-invert max-w-none text-white/90 whitespace-pre-wrap leading-relaxed">
                {results.psychPrep}
            </div>
        )}
        {activeTab === 'specialist' && (
            <div className="space-y-6">
                <div className="prose prose-invert max-w-none text-white/90 whitespace-pre-wrap leading-relaxed">
                    {results.specialistDoc}
                </div>
                
                {results.recommendedTests && (
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <h3 className="text-xl font-bold mb-6 text-white">Рекомендованные тесты</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {results.recommendedTests.map((test: any, idx: number) => (
                                <div key={idx} className="p-5 bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all">
                                    <div className="font-bold text-white mb-1">{test.name}</div>
                                    <div className="text-sm text-white/70">{test.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
