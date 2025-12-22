import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Symptom {
  id: string;
  name: string;
  clarifications: string[];
}

interface SelectedSymptom {
  clarifications: string[];
  customText: string;
}

export const SymptomsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, SelectedSymptom>>({});
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [generalDescription, setGeneralDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await axios.get(`/api/survey/${id}`);
        const session = response.data;
        
        if (session.symptoms && Array.isArray(session.symptoms) && session.symptoms.length > 0) {
          setSymptoms(session.symptoms);
        } else {
          // Получаем список симптомов от Gemini
          const symptomsResponse = await axios.get(`/api/survey/${id}/get-symptoms`);
          setSymptoms(symptomsResponse.data.symptoms || []);
        }

        // Загружаем сохраненные данные
        if (session.symptomsData) {
          setSelectedSymptoms(session.symptomsData);
        }
        if (session.complaint) {
          setGeneralDescription(session.complaint);
        }
      } catch (error) {
        console.error('Не удалось загрузить симптомы', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSymptoms();
  }, [id]);

  const handleSymptomClick = (symptomId: string) => {
    if (!selectedSymptoms[symptomId]) {
      setSelectedSymptoms(prev => ({
        ...prev,
        [symptomId]: { clarifications: [], customText: '' }
      }));
    }
    setActivePopup(symptomId);
  };

  const handleClarificationToggle = (symptomId: string, clarification: string) => {
    setSelectedSymptoms(prev => {
      const current = prev[symptomId] || { clarifications: [], customText: '' };
      const clarifications = current.clarifications.includes(clarification)
        ? current.clarifications.filter(c => c !== clarification)
        : [...current.clarifications, clarification];
      
      return {
        ...prev,
        [symptomId]: { ...current, clarifications }
      };
    });
  };

  const handleCustomTextChange = (symptomId: string, text: string) => {
    setSelectedSymptoms(prev => {
      const current = prev[symptomId] || { clarifications: [], customText: '' };
      return {
        ...prev,
        [symptomId]: { ...current, customText: text }
      };
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedSymptoms).length === 0 && !generalDescription.trim()) {
      alert('Пожалуйста, выберите хотя бы один симптом или опишите свои проблемы');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/survey/${id}/submit-symptoms`, {
        symptoms: selectedSymptoms,
        generalDescription: generalDescription.trim()
      });
      navigate(`/survey/${id}`);
    } catch (error) {
      console.error('Не удалось сохранить симптомы', error);
      alert('Не удалось сохранить данные. Попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white text-xl">Загрузка...</div>;

  const selectedCount = Object.keys(selectedSymptoms).length;

  return (
    <div className="max-w-4xl mx-auto py-12">
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
        <h2 className="text-4xl font-bold mb-4 text-white">Выберите симптомы</h2>
        <p className="text-white/80 text-lg leading-relaxed">
          Выберите симптомы, которые вас беспокоят. Нажмите на симптом, чтобы уточнить детали.
        </p>
      </div>

      {/* Список симптомов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {symptoms.map((symptom) => {
          const isSelected = !!selectedSymptoms[symptom.id];
          return (
            <button
              key={symptom.id}
              onClick={() => handleSymptomClick(symptom.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? 'bg-white/10 border-white shadow-lg'
                  : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-lg font-medium">{symptom.name}</span>
                {isSelected && (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {isSelected && selectedSymptoms[symptom.id].clarifications.length > 0 && (
                <div className="mt-2 text-white/70 text-sm">
                  Выбрано уточнений: {selectedSymptoms[symptom.id].clarifications.length}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Попап для уточнений симптома */}
      {activePopup && symptoms.find(s => s.id === activePopup) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-navy/95 to-navy/80 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">
                {symptoms.find(s => s.id === activePopup)?.name}
              </h3>
              <button
                onClick={() => setActivePopup(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Уточнения */}
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3">Уточнения:</h4>
              <div className="space-y-2">
                {symptoms.find(s => s.id === activePopup)?.clarifications.map((clarification) => {
                  const isSelected = selectedSymptoms[activePopup]?.clarifications.includes(clarification);
                  return (
                    <label
                      key={clarification}
                      className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white/20 border-2 border-white'
                          : 'bg-white/5 border-2 border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleClarificationToggle(activePopup, clarification)}
                        className="w-5 h-5 text-primary focus:ring-primary"
                      />
                      <span className="text-white">{clarification}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Текстовое описание для симптома */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">
                Опишите своими словами (необязательно):
              </label>
              <textarea
                className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="Дополнительные детали..."
                value={selectedSymptoms[activePopup]?.customText || ''}
                onChange={(e) => handleCustomTextChange(activePopup, e.target.value)}
              />
            </div>

            <button
              onClick={() => setActivePopup(null)}
              className="w-full bg-white text-navy px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Готово
            </button>
          </div>
        </div>
      )}

      {/* Общее описание проблем */}
      <div className="mb-8">
        <label className="block text-white text-lg font-semibold mb-4">
          Опишите своими словами свои проблемы:
        </label>
        <textarea
          className="w-full h-48 p-6 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none backdrop-blur-sm text-lg"
          placeholder="Опишите общее состояние, что вас беспокоит..."
          value={generalDescription}
          onChange={(e) => setGeneralDescription(e.target.value)}
        />
      </div>

      {/* Кнопка отправки */}
      <div className="flex justify-between items-center">
        <div className="text-white/60 text-sm">
          Выбрано симптомов: {selectedCount}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || (selectedCount === 0 && !generalDescription.trim())}
          className="bg-white text-navy px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-white/50 transition-all disabled:opacity-50 disabled:hover:shadow-none transform hover:scale-105 disabled:hover:scale-100"
        >
          {submitting ? 'Обработка...' : 'Продолжить'}
        </button>
      </div>
    </div>
  );
};

