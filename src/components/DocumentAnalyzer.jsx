"use client";

import { useState, useEffect, useRef } from 'react';

export default function DocumentAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [question, setQuestion] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Cache to store previous question/answer pairs
  const resultCache = useRef(new Map());
  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // More structured and complete document data
  const documentData = `
# Company Annual Report 2024
    
## Financial Overview
Revenue: $12.5 million
Profit: $3.2 million
Growth: 15% year-over-year
    
## Key Products
- Product A: 45% of revenue ($5.625 million)
- Product B: 30% of revenue ($3.75 million)
- Product C: 25% of revenue ($3.125 million)
    
## Regional Performance
- North America: $6.5 million
- Europe: $4.0 million
- Asia: $2.0 million
    
## Future Outlook
We expect to see 20% growth in the next fiscal year with the launch of Product D.
R&D investments will increase by 25% to focus on AI integration.
  `;

  const analyzeDocument = async () => {
    if (!question.trim()) return;
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Check cache first for immediate response
    const normalizedQuestion = question.trim().toLowerCase();
    if (resultCache.current.has(normalizedQuestion)) {
      setResult(resultCache.current.get(normalizedQuestion));
      setModalOpen(true);
      return;
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsLoading(true);
    
    // Display modal immediately with loading state
    setResult("Analyzing document...");
    setModalOpen(true);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: documentData,
          question: question
        }),
        signal: signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from ArliAI');
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      const resultText = data.result || "No result was returned. Please try asking a different question.";
      setResult(resultText);
      
      // Cache the result for future use
      resultCache.current.set(normalizedQuestion, resultText);
      
    } catch (error) {
      // Only show error if it's not an abort error
      if (error.name !== 'AbortError') {
        setResult(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sample questions for better user experience
  const sampleQuestions = [
    "What is the combined revenue of Product B and Product C?",
    "Which region generates the most revenue?",
    "What are the R&D investment plans?",
    "What is the expected growth next year?"
  ];

  // Function to set a sample question
  const setExampleQuestion = (q) => {
    setQuestion(q);
    // Automatically analyze if using a sample question
    setTimeout(() => analyzeDocument(), 0);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-xl p-8 mb-8">
        <h1 className="text-3xl font-bold mb-8 text-blue-800">Document Analysis with LLM</h1>
        
        <div className="bg-gray-50 p-6 rounded-xl mb-8 shadow-inner border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Document Content:</h2>
          <div className="whitespace-pre-wrap text-gray-700 max-h-80 overflow-y-auto px-4 py-3 font-mono text-sm bg-white rounded-lg border">
            {documentData}
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="question" className="block text-lg font-medium mb-3 text-gray-700">
            Ask a question about the document:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeDocument()}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white"
              placeholder="E.g., What are the R&D investment plans?"
              style={{ color: '#333333', caretColor: '#333333' }}
            />
            <button
              onClick={analyzeDocument}
              disabled={isLoading || !question.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 shadow-sm font-medium transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Analyze'
              )}
            </button>
          </div>
        </div>

        {/* Sample Questions */}
        <div className="mt-8">
          <h3 className="text-md font-medium text-gray-700 mb-3">Try these sample questions:</h3>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setExampleQuestion(q)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* LLM Result Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-0 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">Analysis Result</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-gray-700 mb-6">
                <div className="text-sm text-gray-500 mb-2">Question: {question}</div>
                <div className="text-lg">
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing document...
                    </div>
                  ) : (
                    result
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}