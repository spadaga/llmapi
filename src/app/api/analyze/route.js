// src/app/api/analyze/route.js

export async function POST(request) {
    try {
      console.log('Received request at /api/analyze');
      const { document, question } = await request.json();
      console.log('Request body:', { document: document.substring(0, 100) + '...', question });
  
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides direct, concise answers based on the document provided. If calculations are needed, show your work briefly.'
        },
        {
          role: 'user',
          content: `Document: ${document}\n\nQuestion: ${question}`
        }
      ];
  
      console.log('Request Payload:', {
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
        messages: messages.map(msg => ({ role: msg.role, content: msg.content.substring(0, 50) + '...' })),
        max_tokens: 300,
        temperature: 0.2,
        top_p: 0.8
      });
  
      console.log('SITE_URL:', process.env.SITE_URL);
      console.log('NODE_ENV:', process.env.NODE_ENV);

      console.log('URL:',   process.env.OPENROUTER_API_URL);
      console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '[REDACTED]' : 'Not set');
  
      // Check if API key is set
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables');
      }
  
      const response = await fetch(process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://llmapi-flax.vercel.app/' : 'http://localhost:3000'),
          'X-Title': process.env.SITE_NAME || 'Document Analysis App'
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
          messages: messages,
          max_tokens: 300,
          temperature: 0.2,
          top_p: 0.8
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
        });
        throw new Error(`OpenRouter API error: ${JSON.stringify(errorData.error || response.statusText)}`);
      }
  
      const data = await response.json();
      const resultText = data.choices?.[0]?.message?.content || 'No response from API';
  
      console.log('Usage:', data.usage);
      console.log('Model used:', data.model);
  
      return Response.json({ result: resultText.trim() });
    } catch (error) {
      console.error('API call failed at /api/analyze:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }