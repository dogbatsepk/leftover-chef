const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { ingredients, usedCuisines, dietaryPreference } = body;

    if (!ingredients || ingredients.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Ingredients are required' }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Construct the prompt with emphasis on precision and safety
    let prompt = `Generate a recipe using the following ingredients: ${ingredients.join(', ')}. Ensure measurements are specific, cooking methods are safe, and the recipe aligns with a ${dietaryPreference} diet (if "none", ignore dietary restrictions).`;
    
    // Add cuisine variety if usedCuisines is provided
    if (usedCuisines && usedCuisines.length > 0) {
      prompt += ` The recipe should be from a cuisine not in this list: ${usedCuisines.join(', ')}.`;
    }

    // Specify the response format
    prompt += ` Provide the response in JSON format with the following structure:
    {
      "name": "Recipe Name",
      "cuisine": "Cuisine Type",
      "ingredients": ["ingredient with quantity"],
      "instructions": "Detailed steps to prepare the dish."
    }
    If no recipe is possible, return:
    {
      "name": "",
      "cuisine": "",
      "ingredients": [],
      "instructions": "No recipe possible with these ingredients."
    }`;

    console.log('Sending prompt to OpenAI:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful culinary assistant that provides recipes in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to fetch recipe from OpenAI', details: errorData }),
      };
    }

    const data = await response.json();
    console.log('OpenAI API response:', data);

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error in proxy function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};