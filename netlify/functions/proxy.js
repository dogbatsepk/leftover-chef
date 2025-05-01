const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { ingredients, usedCuisines } = JSON.parse(event.body);
  const apiKey = process.env.OPENAI_API_KEY; // Set in Netlify dashboard

  try {
    console.log('Received request with ingredients:', ingredients, 'and usedCuisines:', usedCuisines); // Debug
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a chef specializing in creating diverse recipes from limited ingredients.' },
          { role: 'user', content: `Generate a concise recipe from a unique cuisine (e.g., Asian, Mexican, Italian, Indian, American, Mediterranean) using ONLY the following ingredients or a subset: ${ingredients.join(', ')}. Ensure the cuisine and cooking style (e.g., stir-fry, grilled, stew) differ from these previously used cuisines: ${usedCuisines.join(', ') || 'none'}. Avoid repeating similar recipes. Do NOT include any additional ingredients. If no recipe is possible, return a message saying so. Return the response as a clean JSON string, without Markdown, backticks, or code blocks. Example: {"name": "Recipe Name", "cuisine": "Cuisine Name", "ingredients": ["ingredient1", "ingredient2"], "instructions": "Step-by-step instructions"}` }
        ],
        temperature: 0.85,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      let message = 'Error calling OpenAI API';
      if (response.status === 429) {
        message = 'Too many requests to OpenAI API. Please wait and try again.';
      }
      throw new Error(`OpenAI API error! Status: ${response.status} - ${message}`);
    }

    const data = await response.json();
    console.log('OpenAI API response:', data); // Debug
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in Netlify Function:', error); // Debug
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};