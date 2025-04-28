// src/app/api/analyze/route.js
export async function POST(request) {
    try {
      const { document, question } = await request.json();
      
      // Optimize the prompt for faster responses
      const prompt = `
  Document: ${document}
  
  Question: ${question}
  
  Provide a direct, concise answer based on the document. If calculations are needed, show your work briefly.
  `;
      
      // Using ArliAI API with optimized parameters
      const response = await fetch('https://api.arliai.com/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ARLIAI_API_KEY || 'af344b1f-eb85-4e03-8786-f2318f62d0cd'}`
        },
        body: JSON.stringify({
          model: 'Mistral-Nemo-12B-Wayfarer', // Consider using a faster model if available
          prompt: prompt,
          max_tokens: 300,     // Balanced for speed and completeness
          temperature: 0.2,    // Lower temperature for faster, more consistent responses
          top_p: 0.8,          // Focus on more likely tokens
          stream: false        // Set to true if you implement streaming responses
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      const resultText = data.choices?.[0]?.text || 'No response from API';
      
      // Simple post-processing to clean up potential formatting issues
      const cleanedResult = resultText.trim();
      
      return Response.json({ result: cleanedResult });
    } catch (error) {
      console.error('API call failed:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }