const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: '只支持 POST 请求' })
      };
    }

    const API_KEY = process.env.VOLCES_API_KEY;
    if (!API_KEY) {
      throw new Error('未配置 VOLCES_API_KEY');
    }

    const requestBody = JSON.parse(event.body);
    const response = await axios.post(
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('AI 服务错误:', error);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data
      })
    };
  }
}; 