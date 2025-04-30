"use client";

import { useState, useEffect, useRef } from "react";
import documentData from "./document-data.js"; // Import the document data from JS file
import ContactForm from "./ContactForm"; // Import the ContactForm component

export default function DocumentAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [question, setQuestion] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [menuCollapsed, setMenuCollapsed] = useState(true); // Default is collapsed on mobile
  const [lastAnalyzedQuestion, setLastAnalyzedQuestion] = useState(""); // Track the last analyzed question
  const [isMobile, setIsMobile] = useState(false); // Track if we're on mobile
  const [showContactForm, setShowContactForm] = useState(false); // New state for showing contact form

  // Cache to store previous question/answer pairs
  const resultCache = useRef(new Map());
  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const analyzeDocument = async () => {
    if (!question.trim()) return;

    setResult("");
    setShowContactForm(false); // Reset contact form visibility on new query

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const normalizedQuestion = question.trim().toLowerCase();

    if (normalizedQuestion === lastAnalyzedQuestion.toLowerCase() && resultCache.current.has(normalizedQuestion)) {
      setResult(resultCache.current.get(normalizedQuestion));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setResult("Analyzing document...");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document: documentData,
          question: question,
        }),
        signal: signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Client-side API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
        });
        throw new Error(`Failed to get response from API: ${JSON.stringify(errorData.error || response.statusText)}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const resultText = data.result || "No result was returned. Please try asking a different question.";
      
      // Check if result contains specific text indicating info not found
      const infoNotFoundPattern = /the document does not mention|couldn't find information|no information|do not have enough| not mentioned in/i;
      
      if (infoNotFoundPattern.test(resultText)) {
        setShowContactForm(true);
        setResult(""); // Clear result to show only contact form
      } else {
        const formattedResult = formatResultAsHTML(resultText);
        setResult(formattedResult);
        resultCache.current.set(normalizedQuestion, formattedResult);
      }
      
      setLastAnalyzedQuestion(question.trim());
    } catch (error) {
      if (error.name !== "AbortError") {
        setResult(`
          <div class="text-red-600 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            ${error.message}
          </div>
        `);
      }
    } finally {
      setIsLoading(false);
    }
  };
console.log("showContactForm",showContactForm);
  const formatResultAsHTML = (text) => {
    // Unchanged formatResultAsHTML function
    if (!text) return '';

    text = text.replace(/[-*•]/g, '');
    const lines = text.split('\n');
    let inList = false;
    let formattedText = '';

    lines.forEach((line, index) => {
      line = line.trim();
      if (line === '') {
        if (inList) {
          formattedText += '</ul>';
          inList = false;
        }
        return;
      }
      if (/^\d+\.\s/.test(line)) {
        if (inList) {
          formattedText += '</ul>';
          inList = false;
        }
        formattedText += `<div class="flex items-start mb-3"><span class="font-bold text-blue-600 mr-2">${line.match(/^\d+\./)[0]}</span><span class="flex-1">${line.replace(/^\d+\.\s/, '')}</span></div>`;
      } else if (/^(.*?):$/.test(line)) {
        if (inList) {
          formattedText += '</ul>';
          inList = false;
        }
        formattedText += `<h3 class="text-xl font-bold text-blue-700 mt-4 mb-2">${line.replace(/:$/, '')}</h3>`;
      } else {
        const isListItem = !/^(.*?):$/.test(line) && !/^\d+\.\s/.test(line);
        if (isListItem) {
          if (!inList) {
            formattedText += '<ul class="list-disc list-inside mb-4 text-gray-800">';
            inList = true;
          }
          formattedText += `<li class="text-gray-800">${line}</li>`;
        } else {
          if (inList) {
            formattedText += '</ul>';
            inList = false;
          }
          if (!formattedText.endsWith(`<h3 class="text-xl font-bold text-blue-700 mt-4 mb-2">${line}</h3>`)) {
            formattedText += `<p class="mb-4 leading-relaxed text-gray-800">${line}</p>`;
          }
        }
      }
    });

    if (inList) formattedText += '</ul>';

    const keyTerms = [
      'ExponentX', 'IT Consulting', 'Cloud Solutions', 'Automation',
      'AI', 'Enterprise-Ready', 'Digital transformation', 'CRM', 'ERP'
    ];

    keyTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      formattedText = formattedText.replace(regex, `<span class="font-semibold text-blue-600">${term}</span>`);
    });

    formattedText = formattedText.replace(/<li class="text-gray-800">(.*?)<\/li>/g, (match, content) => {
      let updatedContent = content;
      keyTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        updatedContent = updatedContent.replace(regex, `{{TEMP_${term}_TEMP}}`);
      });
      updatedContent = `<span class="text-gray-800">${updatedContent}</span>`;
      keyTerms.forEach(term => {
        updatedContent = updatedContent.replace(new RegExp(`{{TEMP_${term}_TEMP}}`, 'g'), `<span class="font-semibold text-blue-600">${term}</span>`);
      });
      return `<li class="text-gray-800">${updatedContent}</li>`;
    });

    return formattedText;
  };

  const sampleQuestions = [
    "What are the key services offered by ExponentX?",
    "Where is ExponentX located?",
    "What cloud services does ExponentX provide?",
    "What is their customer commitment?",
  ];

  const setExampleQuestion = (q) => {
    setQuestion(q);
    setResult("");
    setShowContactForm(false);
    setTimeout(() => analyzeDocument(), 0);
  };

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
    setResult("");
    setShowContactForm(false);
  };

  // Close menu when clicking outside on mobile
  const closeMenu = () => {
    if (isMobile) {
      setMenuCollapsed(true);
    }
  };

  if (!isClient) {
    return null;
  }

  // Navigation items with their icons and text
  const navItems = [
    {
      name: "New Chat",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
      ),
      active: true
    },
    {
      name: "Recent Chats",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      active: false
    },
    {
      name: "Contact Us",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      ),
      active: false
    },
    {
      name: "About Us",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
      active: false
    }
  ];
  console.log("showContactForm",showContactForm);
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay - only visible on mobile when menu is open */}
      {isMobile && !menuCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 opacity-50 z-20"
          onClick={closeMenu}
        ></div>
      )}
      
      {/* Left navigation sidebar - positioning changes based on device and menu state */}
      <div 
        className={`bg-white shadow-md flex-shrink-0 border-r border-gray-200 transition-all duration-300 ease-in-out z-30
          ${isMobile 
            ? `fixed h-full ${menuCollapsed ? '-left-64' : 'left-0'} w-64` 
            : `fixed h-full ${menuCollapsed ? 'w-16' : 'w-56'}`
          }`}
      >
        <div className={`p-4 border-b border-gray-200 flex items-center ${isMobile ? 'justify-between' : menuCollapsed ? 'justify-center' : 'justify-between'}`}>
          {isMobile && (
            <div className="flex items-center">
              <span className="font-semibold">
              <h1 class="text-xl md:text-2xl font-bold">Exponent<span class="text-orange-500">X</span></h1>
              </span>
            </div>
          )}
          
          <button 
            className="text-gray-500 hover:text-gray-800 focus:outline-none"
            onClick={() => setMenuCollapsed(!menuCollapsed)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMobile ? (
                menuCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                )
              ) : (
                menuCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8M4 18h7"></path>
                )
              )}
            </svg>
          </button>
        </div>
        
        <nav className="p-2">
          {navItems.map((item, index) => (
            <a 
              key={index} 
              href="#" 
              className={`flex items-center ${!isMobile && menuCollapsed ? 'justify-center' : ''} px-4 py-3 ${
                item.active 
                  ? 'bg-orange-50 text-orange-500' 
                  : 'text-gray-600 hover:bg-gray-100'
              } rounded-md mb-2 transition-all duration-200`}
            >
              <div className={!isMobile && menuCollapsed ? 'mx-auto' : 'mr-3'}>
                {item.icon}
              </div>
              {(isMobile || !menuCollapsed) && <span>{item.name}</span>}
            </a>
          ))}
        </nav>
      </div>
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isMobile 
          ? '' // No margin on mobile, as sidebar overlays content
          : menuCollapsed ? 'ml-16' : 'ml-56'
      }`}>
        {/* Header with hamburger menu for mobile and ExponentX text */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between md:justify-center">
          {isMobile && (
            <button 
              onClick={() => setMenuCollapsed(false)}
              className="text-white focus:outline-none md:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
              </svg>
            </button>
          )}
          
          <h1 className="text-xl md:text-2xl font-bold">
            Exponent<span className="text-orange-500">X</span>
          </h1>
          
          {/* Empty div to balance the flex layout on mobile */}
          {isMobile && <div className="w-6"></div>}
        </div>
        
        <div className="max-w-5xl mx-auto p-4 md:p-6 w-full">
          {/* Input Container */}
          <div className="bg-white shadow-md rounded-lg p-4 md:p-6 mb-8 border border-gray-200">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                Try these sample questions:
              </p>
              <div className="flex flex-wrap gap-2">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setExampleQuestion(q)}
                    className="bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                id="question"
                value={question}
                onChange={handleQuestionChange}
                onKeyPress={(e) => e.key === "Enter" && analyzeDocument()}
                className="w-full sm:flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm text-gray-900 bg-white mb-2 sm:mb-0"
                placeholder="Type your message here..."
              />
              <button
                onClick={analyzeDocument}
                disabled={isLoading || !question.trim()}
                className="w-full sm:w-auto bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 shadow-sm font-medium transition-all flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  ></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Results Container */}
          {(isLoading || result || showContactForm) && (
            <div className="bg-white shadow-md rounded-lg p-4 md:p-6 border border-gray-200">
              
              {isLoading ? (
                <div className="flex items-center gap-3 justify-center py-8">
                  <svg
                    className="animate-spin h-6 w-6 text-orange-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-lg text-gray-700 font-medium">
                    Analyzing ...
                  </span>
                </div>
              ) : showContactForm ? (
                // Display the contact form when information is not found
                <ContactForm  />
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: result }}
                  className="prose max-w-none text-gray-800 text-sm md:text-base"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}