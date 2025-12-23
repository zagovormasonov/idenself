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
        
        console.log('Session data:', session);
        
        // Check if symptoms need to be selected
        if (session.status === 'SYMPTOMS_PENDING' || !session.questionnaires || session.questionnaires.length === 0) {
          console.log('Redirecting to symptoms - status:', session.status, 'questionnaires:', session.questionnaires);
          navigate(`/symptoms/${id}`);
          return;
        }

        // Determine state
        const lastQ = session.questionnaires[session.questionnaires.length - 1];
        console.log('Last questionnaire:', lastQ);
        
        if (session.status === 'FINISHED' || (lastQ && lastQ.type === 'RESULTS')) {
            navigate(`/results/${id}`);
            return;
        }

        if (lastQ && lastQ.questions) {
            // Проверяем, что questions - это массив и он не пустой
            const questionsArray = Array.isArray(lastQ.questions) ? lastQ.questions : [];
            if (questionsArray.length === 0) {
              console.error('Questions array is empty');
              alert('Вопросы не были сгенерированы. Пожалуйста, попробуйте еще раз.');
              navigate(`/symptoms/${id}`);
              return;
            }
            // Логируем структуру вопросов для отладки
            console.log('Questions structure:', questionsArray);
            questionsArray.forEach((q: any, index: number) => {
              console.log(`Question ${index}:`, { id: q.id, text: q.text, type: q.type, options: q.options });
            });
            setQuestions(questionsArray);
            const partMap: Record<string, string> = {
              'PART1': 'Этап 1',
              'PART2': 'Этап 2',
              'PART3': 'Этап 3'
            };
            setPart(partMap[lastQ.type] || lastQ.type);
        } else {
          // No questions available, redirect to symptoms
          console.error('No questions found in last questionnaire');
          alert('Вопросы не найдены. Перенаправляем на выбор симптомов...');
          navigate(`/symptoms/${id}`);
        }
      } catch (error: any) {
        console.error('Не удалось загрузить сессию', error);
        // Если ошибка авторизации, перенаправляем на логин
        if (error.response?.status === 401) {
          navigate('/login');
          return;
        }
        // Если сессия не найдена, перенаправляем на начало
        if (error.response?.status === 404) {
          navigate('/complaint');
          return;
        }
        // Другие ошибки
        alert('Не удалось загрузить данные. Попробуйте обновить страницу.');
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
    // Validate that all questions are answered
    const unansweredQuestions = questions.filter((q: any) => {
      const answer = answers[q.id];
      if (q.type === 'text') {
        return !answer || answer.trim() === '';
      }
      return answer === undefined || answer === null || answer === '';
    });

    if (unansweredQuestions.length > 0) {
      alert(`Пожалуйста, ответьте на все вопросы. Осталось ${unansweredQuestions.length} вопросов.`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`/api/survey/${id}/submit`, { answers });
      
      console.log('Submit response:', response.data);
      
      if (response.data.nextStep === 'FINISHED') {
        navigate(`/results/${id}`);
      } else {
        // Проверяем, что questions существует и это массив
        if (!response.data.questions || !Array.isArray(response.data.questions)) {
          throw new Error('Сервер вернул некорректные данные. Попробуйте еще раз.');
        }
        
        // Проверяем, что массив не пустой
        if (response.data.questions.length === 0) {
          throw new Error('Вопросы не были сгенерированы. Попробуйте еще раз.');
        }
        
        setQuestions(response.data.questions);
        setAnswers({});
        const partMap: Record<string, string> = {
          'PART2': 'Этап 2',
          'PART3': 'Этап 3'
        };
        setPart(partMap[response.data.nextStep] || response.data.nextStep);
        window.scrollTo(0, 0);
      }
    } catch (error: any) {
      console.error('Не удалось отправить ответы', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Не удалось отправить ответы. Попробуйте еще раз.';
      alert(errorMessage);
      // Не сбрасываем submitting, чтобы пользователь мог попробовать еще раз
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white text-xl">Загрузка...</div>;

  // Если нет вопросов, но loading завершен, значит что-то пошло не так
  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-white/60 hover:text-white mb-6 transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад
        </button>
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-6 text-center">
          <p className="text-white text-lg mb-4">Вопросы не загружены. Возможно, произошла ошибка при генерации вопросов.</p>
          <button
            onClick={() => navigate(`/symptoms/${id}`)}
            className="bg-white text-navy px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all mt-4"
          >
            Вернуться к выбору симптомов
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-white/60 hover:text-white mb-6 transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад
      </button>
      <div className="mb-8">
        <span className="text-sm font-bold text-white/60 tracking-wider uppercase">{part}</span>
        <h2 className="text-3xl font-bold mt-2 text-white">
            {part === 'Этап 1' ? 'Первичный опросник' : part === 'Этап 2' ? 'Вторичный опросник' : part === 'Этап 3' ? 'Дополнительные тесты' : 'Опросник'}
        </h2>
      </div>
      
      <div className="space-y-6">
        {questions && Array.isArray(questions) && questions.length > 0 && questions.map((q: any) => {
          // Определяем тип вопроса (с fallback на 'text' если тип не указан)
          const questionType = q.type || 'text';
          
          return (
            <div key={q.id || `q-${Math.random()}`} className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
              <label className="block text-lg font-medium text-white mb-4">{q.text || 'Вопрос без текста'}</label>
              
              {questionType === 'text' && (
                <textarea
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  rows={3}
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Ваш ответ..."
                />
              )}
              
              {questionType === 'choice' && (
                <div className="space-y-3">
                  {q.options && Array.isArray(q.options) && q.options.length > 0 ? (
                    q.options.map((opt: string) => (
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
                    ))
                  ) : (
                    <div className="text-white/60 text-sm">Варианты ответов не загружены</div>
                  )}
                </div>
              )}

              {questionType === 'scale' && (
                <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
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
              
              {/* Fallback для неизвестных типов - показываем текстовое поле */}
              {questionType !== 'text' && questionType !== 'choice' && questionType !== 'scale' && (
                <div>
                  <div className="text-yellow-500/80 text-sm mb-2">
                    Неизвестный тип вопроса: {questionType}. Используется текстовое поле.
                  </div>
                  <textarea
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    rows={3}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Ваш ответ..."
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex justify-between items-center">
        <div className="text-white/60 text-sm">
          Отвечено: {Object.keys(answers).length} из {questions?.length || 0}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !questions || Object.keys(answers).length < questions.length}
          className="bg-white text-navy px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-white/50 transition-all disabled:opacity-50 disabled:hover:shadow-none transform hover:scale-105 disabled:hover:scale-100"
        >
          {submitting ? 'Обработка...' : 'Продолжить'}
        </button>
      </div>
    </div>
  );
};

