import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export const VariantSelectionPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const response = await axios.get(`/api/survey/${id}`);
        const session = response.data;
        const variantsQ = session.questionnaires.find((q: any) => q.type === 'VARIANTS');
        
        if (variantsQ && variantsQ.questions?.variants && Array.isArray(variantsQ.questions.variants) && variantsQ.questions.variants.length > 0) {
          setVariants(variantsQ.questions.variants);
        } else {
          setError('Варианты не были сгенерированы. Пожалуйста, попробуйте еще раз.');
        }
      } catch (error: any) {
        console.error('Не удалось загрузить варианты', error);
        setError('Не удалось загрузить варианты. Пожалуйста, попробуйте еще раз.');
      } finally {
        setLoading(false);
      }
    };
    fetchVariants();
  }, [id]);

  const handleVariantSelect = (variant: string) => {
    setSelectedVariant(variant);
  };

  const handleSubmit = async () => {
    if (!selectedVariant) return;
    
    setSubmitting(true);
    try {
      const response = await axios.post(`/api/survey/${id}/select-variant`, {
        selectedVariant
      });
      navigate(`/survey/${id}`);
    } catch (error: any) {
      console.error('Не удалось выбрать вариант', error);
      setError(error.response?.data?.message || 'Не удалось выбрать вариант. Пожалуйста, попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white text-xl">Генерирую варианты...</div>;

  if (error || variants.length === 0) {
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
        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 text-center">
          <p className="text-white text-lg mb-4">{error || 'Варианты не были сгенерированы'}</p>
          <button
            onClick={() => navigate('/complaint')}
            className="bg-white text-navy px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Вернуться к описанию жалоб
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
        <h2 className="text-4xl font-bold mb-4 text-white">Выберите наиболее подходящий вариант</h2>
        <p className="text-white/80 text-lg leading-relaxed">
          На основе вашего описания мы подготовили несколько вариантов. Выберите тот, который наиболее точно отражает ваше состояние.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {variants.map((variant, index) => (
          <button
            key={index}
            onClick={() => handleVariantSelect(variant)}
            className={`w-full p-6 text-left rounded-2xl border-2 transition-all ${
              selectedVariant === variant
                ? 'bg-white/10 border-white shadow-lg transform scale-[1.02]'
                : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                selectedVariant === variant
                  ? 'border-white bg-white'
                  : 'border-white/50'
              }`}>
                {selectedVariant === variant && (
                  <svg className="w-4 h-4 text-navy" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-white text-lg font-medium flex-1">{variant}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!selectedVariant || submitting}
          className="bg-white text-navy px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-white/50 transition-all disabled:opacity-50 disabled:hover:shadow-none transform hover:scale-105 disabled:hover:scale-100"
        >
          {submitting ? 'Обработка...' : 'Продолжить'}
        </button>
      </div>
    </div>
  );
};

