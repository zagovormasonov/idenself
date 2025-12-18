import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export const SurveyPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [part, setPart] = useState('PART1');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get(`/api/survey/${id}`);
        const session = response.data;
        
        // Determine state
        const lastQ = session.questionnaires[session.questionnaires.length - 1];
        
        if (session.status === 'FINISHED' || (lastQ && lastQ.type === 'RESULTS')) {
            navigate(`/results/${id}`);
            return;
        }

        if (lastQ) {
            setQuestions(lastQ.questions);
            setPart(lastQ.type);
        }
      } catch (error) {
        console.error('Failed to load session', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id, navigate]);

  const handleAnswerChange = (qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post(`/api/survey/${id}/submit`, { answers });
      if (response.data.nextStep === 'FINISHED') {
        navigate(`/results/${id}`);
      } else {
        setQuestions(response.data.questions);
        setAnswers({});
        setPart('PART2');
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('Failed to submit answers', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white text-xl">Загрузка...</div>;

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="mb-8">
        <span className="text-sm font-bold text-white/60 tracking-wider uppercase">{part === 'PART1' ? 'Этап 1' : 'Этап 2'}</span>
        <h2 className="text-3xl font-bold mt-2 text-white">
            {part === 'PART1' ? 'Начальная оценка' : 'Углубленный анализ'}
        </h2>
      </div>
      
      <div className="space-y-6">
        {questions.map((q: any) => (
          <div key={q.id} className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
            <label className="block text-lg font-medium text-white mb-4">{q.text}</label>
            
            {q.type === 'text' && (
              <textarea
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                rows={3}
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="Ваш ответ..."
              />
            )}
            
            {q.type === 'choice' && (
              <div className="space-y-3">
                {q.options.map((opt: string) => (
                  <label key={opt} className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-white/10 rounded-lg transition-all">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="text-primary focus:ring-primary h-5 w-5"
                    />
                    <span className="text-white/90">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'scale' && (
                 <div className="flex justify-between items-center mt-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleAnswerChange(q.id, num)}
                            className={`w-10 h-10 rounded-full font-medium transition-all ${
                                answers[q.id] === num 
                                ? 'bg-white text-navy shadow-lg transform scale-110' 
                                : 'bg-white/20 text-white/70 hover:bg-white/30'
                            }`}
                        >
                            {num}
                        </button>
                    ))}
                 </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-white text-navy px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-white/50 transition-all disabled:opacity-50 disabled:hover:shadow-none transform hover:scale-105 disabled:hover:scale-100"
        >
          {submitting ? 'Обработка...' : 'Продолжить'}
        </button>
      </div>
    </div>
  );
};

