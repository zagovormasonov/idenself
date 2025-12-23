import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface CompletedSession {
  id: number;
  complaint: string | null;
  createdAt: string;
  updatedAt: string;
  questionnaires: Array<{
    id: number;
    type: string;
    questions: any;
    createdAt: string;
  }>;
}

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('/api/survey/user/completed');
        setSessions(response.data);
      } catch (error: any) {
        console.error('Не удалось загрузить сессии', error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSessions();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultsPreview = (questions: any) => {
    if (!questions || typeof questions !== 'object') return 'Результаты недоступны';
    
    // Пытаемся получить personalPlan или первый доступный текст
    if (questions.personalPlan) {
      const preview = questions.personalPlan.substring(0, 150);
      return preview + (questions.personalPlan.length > 150 ? '...' : '');
    }
    
    return 'Результаты готовы';
  };

  if (loading) {
    return <div className="text-center py-20 text-white text-xl">Загрузка...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">Личный кабинет</h1>
        <p className="text-white/60 text-lg">Ваши завершенные оценки ментального здоровья</p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 text-center">
          <p className="text-white/80 text-lg mb-4">У вас пока нет завершенных оценок</p>
          <button
            onClick={() => navigate('/complaint')}
            className="bg-white text-navy px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Начать новую оценку
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const resultsQuestionnaire = session.questionnaires.find(q => q.type === 'RESULTS');
            const hasResults = !!resultsQuestionnaire;

            return (
              <div
                key={session.id}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => hasResults && navigate(`/results/${session.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Оценка от {formatDate(session.updatedAt)}
                    </h3>
                    {session.complaint && (
                      <p className="text-white/70 text-sm mb-2">
                        Жалоба: {session.complaint.length > 100 
                          ? session.complaint.substring(0, 100) + '...' 
                          : session.complaint}
                      </p>
                    )}
                    {hasResults && resultsQuestionnaire.questions && (
                      <p className="text-white/60 text-sm">
                        {getResultsPreview(resultsQuestionnaire.questions)}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    {hasResults ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        Завершено
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        В процессе
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-white/50">
                  <span>Создано: {formatDate(session.createdAt)}</span>
                  {hasResults && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/results/${session.id}`);
                      }}
                      className="text-white/80 hover:text-white font-medium transition-colors"
                    >
                      Просмотреть результаты →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/complaint')}
          className="bg-white text-navy px-8 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-white/50 transition-all transform hover:scale-105"
        >
          Начать новую оценку
        </button>
      </div>
    </div>
  );
};

