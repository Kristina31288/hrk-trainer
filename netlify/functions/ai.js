exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: { message: 'GROQ_API_KEY не настроен' } })
      };
    }

    // Groq отключил llama-3.3-70b-versatile на бесплатном тарифе 16.08.2026.
    // Модель можно сменить без правки кода: переменная GROQ_MODEL в настройках Netlify.
    const models = [process.env.GROQ_MODEL || 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

    const callGroq = (model) => fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model,
        // у gpt-oss размышления тоже тратят токены — даём запас
        max_tokens: (body.max_tokens || 400) + 600,
        reasoning_effort: 'low',
        temperature: 0.85,
        messages: body.messages || []
      })
    });

    let response = await callGroq(models[0]);
    let data = await response.json();

    // если основная модель недоступна — пробуем запасную
    if (!response.ok && (response.status === 404 || response.status === 400) && models[1] !== models[0]) {
      response = await callGroq(models[1]);
      data = await response.json();
    }

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: err.message } })
    };
  }
};
