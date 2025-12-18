import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; // Assuming we might want markdown, but I will simulate it with pre-wrap for now to save install

export const ResultsPage: React.FC = () => {
  const { id } = useParams();
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
        console.error('Failed to load results', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading Analysis...</div>;
  if (!results) return <div className="text-center py-20">No results found.</div>;

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-4xl font-bold mb-2 text-center text-primary">Your Assessment Complete</h1>
      <p className="text-center text-secondary mb-12">Here is your personalized mental health breakdown.</p>

      <div className="flex justify-center space-x-4 mb-8 border-b border-gray-200 pb-1">
        {['plan', 'psychologist', 'specialist'].map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-6 font-medium text-lg capitalize transition-all border-b-2 ${
                    activeTab === tab 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-400 hover:text-secondary'
                }`}
            >
                {tab === 'plan' ? 'Personal Plan' : tab}
            </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 min-h-[500px]">
        {activeTab === 'plan' && (
            <div className="prose max-w-none text-secondary whitespace-pre-wrap">
                {results.personalPlan}
            </div>
        )}
        {activeTab === 'psychologist' && (
            <div className="prose max-w-none text-secondary whitespace-pre-wrap">
                {results.psychPrep}
            </div>
        )}
        {activeTab === 'specialist' && (
            <div className="space-y-6">
                <div className="prose max-w-none text-secondary whitespace-pre-wrap">
                    {results.specialistDoc}
                </div>
                
                {results.recommendedTests && (
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h3 className="text-xl font-bold mb-4 text-primary">Recommended Tests</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {results.recommendedTests.map((test: any, idx: number) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="font-bold text-secondary">{test.name}</div>
                                    <div className="text-sm text-gray-500">{test.description}</div>
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

