"use client";

import { useState, useEffect, useRef } from "react";

export default function DocumentAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [question, setQuestion] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [lastAnalyzedQuestion, setLastAnalyzedQuestion] = useState(""); // Track the last analyzed question

  // Cache to store previous question/answer pairs
  const resultCache = useRef(new Map());
  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ExponentX Technologies document data
  const documentData = `
ExponentX Technologies

Welcome to ExponentX Technologies, your trusted partner for comprehensive technology solutions. We are dedicated to helping businesses leverage the power of technology to achieve their goals and gain a competitive edge. Our expert team provides a wide range of technology services designed to streamline your operations and enhance your organization's performance.

Key Services

IT Consulting:

We offer advice on infrastructure, security, cloud strategies, automation, and digital transformation to optimize your IT operations.
Managed IT Services:

Comprehensive managed IT services, including 24/7 monitoring, maintenance, and support.
Automation:

We specialize in business process automation solutions, including workflow automation, robotic process automation (RPA), and Generative AI to increase efficiency and reduce costs.
Cloud Solutions:

Cloud consulting, migration, and management services to help navigate the complexities of cloud computing.
Modern Tools:

We stay at the forefront of technology, offering the latest tools and solutions, including AI and machine learning implementations, and data analytics solutions.
Enterprise-Ready Solutions:

We specialize in designing and developing robust enterprise-grade solutions tailored to meet your business needs, leveraging the latest technologies and frameworks.
Customer Commitment

Our services help businesses increase efficiency, leverage modern technologies, and ultimately gain a competitive advantage. Our commitment to customer satisfaction is at the heart of what we do. We strive to build long-term partnerships, providing reliable support and strategic advice. Our team of experienced professionals is dedicated to delivering exceptional service, ensuring that your technology investments drive tangible results.

About Us

Leading the way in innovative solutions, ExponentX believes that innovative software has the power to transform businesses and pave the way for their success. As a leading technology services company, we are dedicated to helping our clients stay ahead of the curve in the ever-changing digital landscape. Our experienced team provides customized solutions, ensuring that our clients' software is tailored to their specific requirements.

Contact Us

ExponentX Technologies is here to help you. Get in touch with us today to learn how we can become your strategic technology partner. Let us show you how we can transform your business through innovative and reliable technology solutions.

Our Services

IT Consulting & Services

Our IT consulting services provide businesses with strategic guidance and expertise to align their technology with their organizational goals. We offer advice on:

Infrastructure
Security
Cloud strategies
Automation
Digital transformation
Our comprehensive managed IT services include 24/7 monitoring, maintenance, and support. Our team of experts becomes your trusted partner, ensuring the smooth and efficient functioning of your IT infrastructure. We also provide proactive problem-solving and strategic planning to keep your business running at its best.

Cloud & Automation & AI

We specialize in process automation to increase efficiency and reduce costs. Our automation solutions include:

Workflow automation
Robotic process automation (RPA)
Business process automation
By streamlining repetitive tasks, we help your business save time, minimize errors, and focus on core activities. Our cloud experts help businesses leverage the power of the cloud, offering:

Cloud consulting
Migration
Management services
Whether you're looking for public, private, or hybrid cloud solutions, we ensure your journey to the cloud is seamless and secure. We stay at the forefront of technology, offering the latest tools and solutions, including:

AI and machine learning implementations
Data analytics solutions
Our experts help you harness the power of these modern tools to drive innovation, gain valuable insights, and make data-driven decisions.

Enterprise-Ready Solutions

We specialize in designing and developing robust enterprise-grade solutions tailored to meet your business needs. Our expert developers create feature-rich and user-friendly web applications, leveraging the latest technologies and frameworks. Our offerings include:

E-Commerce platforms
Content management systems
Customized web-based solutions
We deliver high-performance and secure applications that drive your business forward. Our solutions also encompass:

ERP (Enterprise Resource Planning)
CRM (Customer Relationship Management) systems
Customized software that streamlines your business processes, enhances efficiency, and provides valuable insights through data analytics.
Contact Us

If you are looking for your business's digital transformation, we are here to help.

Contact Us

Feel free to reach out to us for any inquiries or assistance. We are here to help you with your technology needs.

Contact Information

Email Address: info@exponentx.co

Website: ExponentX

Location: Hong Kong SAR, China

Send Us a Message

If you have any questions or would like to discuss your project, please send us a message using the contact form on our website.
  `;

  const analyzeDocument = async () => {
    if (!question.trim()) return;

    // Clear previous result before starting new analysis
    setResult("");

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const normalizedQuestion = question.trim().toLowerCase();

    // Check if the question is the same as the last analyzed one
    if (normalizedQuestion === lastAnalyzedQuestion.toLowerCase() && resultCache.current.has(normalizedQuestion)) {
      setResult(resultCache.current.get(normalizedQuestion));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Display loading state directly on the page
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
        throw new Error("Failed to get response from ArliAI");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Format the result as rich HTML
      const resultText = formatResultAsHTML(
        data.result || "No result was returned. Please try asking a different question."
      );
      setResult(resultText);

      // Cache the result for future use
      resultCache.current.set(normalizedQuestion, resultText);

      // Update the last analyzed question
      setLastAnalyzedQuestion(question.trim());
    } catch (error) {
      // Only show error if it's not an abort error
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

  // Function to format the result as rich HTML
  const formatResultAsHTML = (text) => {
    if (!text) return '';

    // Replace custom bullet points with spaces for processing
    text = text.replace(/[-*•]/g, '');

    // Split the text into lines for processing
    const lines = text.split('\n');
    let inList = false;
    let formattedText = '';

    lines.forEach((line, index) => {
      line = line.trim();

      // Skip empty lines, but close any open list
      if (line === '') {
        if (inList) {
          formattedText += '</ul>';
          inList = false;
        }
        return; // Avoid adding extra <br> for empty lines
      }

      // Handle numbered lists (e.g., "1. Item")
      if (/^\d+\.\s/.test(line)) {
        if (inList) {
          formattedText += '</ul>';
          inList = false;
        }
        formattedText += `<div class="flex items-start mb-3"><span class="font-bold text-blue-600 mr-2">${line.match(/^\d+\./)[0]}</span><span class="flex-1">${line.replace(/^\d+\.\s/, '')}</span></div>`;
      }
      // Handle headers (lines ending with a colon)
      else if (/^(.*?):$/.test(line)) {
        if (inList) {
          formattedText += '</ul>';
          inList = false;
        }
        formattedText += `<h3 class="text-xl font-bold text-blue-700 mt-4 mb-2">${line.replace(/:$/, '')}</h3>`;
      }
      // Handle list items (non-header, non-numbered lines)
      else {
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
          // Only add as a paragraph if it's not already processed as a header or list item
          if (!formattedText.endsWith(`<h3 class="text-xl font-bold text-blue-700 mt-4 mb-2">${line}</h3>`)) {
            formattedText += `<p class="mb-4 leading-relaxed text-gray-800">${line}</p>`;
          }
        }
      }
    });

    // Close any open list at the end
    if (inList) formattedText += '</ul>';

    // Highlight key terms without affecting the entire bullet point
    const keyTerms = [
      'ExponentX', 'IT Consulting', 'Cloud Solutions', 'Automation',
      'AI', 'Enterprise-Ready', 'Digital transformation', 'CRM', 'ERP'
    ];

    keyTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      formattedText = formattedText.replace(regex, `<span class="font-semibold text-blue-600">${term}</span>`);
    });

    // Ensure all <li> elements have consistent text color
    formattedText = formattedText.replace(/<li class="text-gray-800">(.*?)<\/li>/g, (match, content) => {
      // Split the content into parts to isolate key terms and apply consistent styling to non-highlighted text
      let updatedContent = content;
      keyTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        updatedContent = updatedContent.replace(regex, `{{TEMP_${term}_TEMP}}`); // Temporarily replace key terms
      });
      // Wrap non-highlighted text in a span with text-gray-800
      updatedContent = `<span class="text-gray-800">${updatedContent}</span>`;
      // Restore key terms with their highlighting
      keyTerms.forEach(term => {
        updatedContent = updatedContent.replace(new RegExp(`{{TEMP_${term}_TEMP}}`, 'g'), `<span class="font-semibold text-blue-600">${term}</span>`);
      });
      return `<li class="text-gray-800">${updatedContent}</li>`;
    });

    return formattedText;
  };

  // Updated sample questions for ExponentX Technologies
  const sampleQuestions = [
    "What are the key services offered by ExponentX?",
    "Where is ExponentX located?",
    "What cloud services does ExponentX provide?",
    "What is their customer commitment?",
  ];

  // Function to set a sample question and clear previous result
  const setExampleQuestion = (q) => {
    setQuestion(q);
    setResult(""); // Clear previous result
    setTimeout(() => analyzeDocument(), 0);
  };

  // Clear result when question changes
  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
    setResult(""); // Clear previous result
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="bg-white shadow-xl rounded-xl p-8 mb-8 border border-blue-100">
        <div className="flex items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-lg mr-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-blue-800 font-sans">
            Document Analysis with LLM
          </h1>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl mb-8 shadow-inner border border-gray-200">
          <div className="flex items-center mb-4">
            <svg
              className="w-5 h-5 text-blue-700 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"></path>
              <path d="M3 8a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"></path>
            </svg>
            <h2 className="text-xl font-semibold text-gray-800">
              Document Content:
            </h2>
          </div>
          <div className="whitespace-pre-wrap text-gray-700 max-h-80 overflow-y-auto px-4 py-3 font-mono text-sm bg-white rounded-lg border">
            {documentData}
          </div>
        </div>

        {/* Sample Questions */}
        <div className="mt-8 mb-8">
          <h3 className="flex items-center text-md font-medium text-gray-700 mb-3">
            <svg
              className="w-5 h-5 text-blue-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"></path>
            </svg>
            Try these sample questions:
          </h3>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setExampleQuestion(q)}
                className="bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Query Container */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="question"
              value={question}
              onChange={handleQuestionChange}
              onKeyPress={(e) => e.key === "Enter" && analyzeDocument()}
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white"
              placeholder="How can we help?"
              style={{ color: "#333333", caretColor: "#333333" }}
            />
            <button
              onClick={analyzeDocument}
              disabled={isLoading || !question.trim()}
              className="bg-gray-200 text-gray-600 px-4 py-3 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm font-medium transition-all"
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
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="mt-8 bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Answer:</h3>
            {isLoading ? (
              <div className="flex items-center gap-3 justify-center py-8">
                <svg
                  className="animate-spin h-6 w-6 text-blue-600"
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
                <span className="text-lg text-blue-800 font-medium">
                  Analyzing document...
                </span>
              </div>
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: result }}
                className="prose max-w-none text-gray-800"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}