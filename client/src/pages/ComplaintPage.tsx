import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const ComplaintPage: React.FC = () => {
  const [complaint, setComplaint] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!complaint.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post('/api/survey/start', { complaint });
      navigate(`/survey/${response.data.sessionId}`);
    } catch (error) {
      console.error('Failed to start survey', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h2 className="text-3xl font-bold mb-6 text-primary">How are you feeling?</h2>
      <p className="mb-8 text-secondary text-lg">
        Describe your complaints, symptoms, or what's bothering you in your own words. The more detail you provide, the better we can help.
      </p>
      <textarea
        className="w-full h-64 p-6 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg resize-none"
        placeholder="I've been feeling..."
        value={complaint}
        onChange={(e) => setComplaint(e.target.value)}
      />
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || !complaint.trim()}
          className="bg-primary text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? 'Analyzing...' : 'Start Assessment'}
        </button>
      </div>
    </div>
  );
};

