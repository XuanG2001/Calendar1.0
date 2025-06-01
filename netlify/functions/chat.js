const axios = require('axios');

exports.handler = async function(event, context) {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // 从环境变量获取 API 密钥
    const API_KEY = process.env.VOLCES_API_KEY;

    // 转发请求到 Volces API
    const response = await axios({
      method: 'POST',
      url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      data: JSON.parse(event.body),
    });

    // 返回 API 响应
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.response?.data || 'Internal Server Error',
      }),
    };
  }
}; 