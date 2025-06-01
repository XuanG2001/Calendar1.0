const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: '只支持 POST 请求' })
      };
    }

    const API_KEY = process.env.VOLCES_API_KEY;
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: '未配置 VOLCES_API_KEY' })
      };
    }

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: '无效的请求体格式' })
      };
    }

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
    
    // 检查是否是 API 响应错误
    if (error.response) {
      return {
        statusCode: error.response.status,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: '调用 AI 服务失败',
          details: error.response.data
        })
      };
    }

    // 其他错误
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: '服务器内部错误',
        message: error.message
      })
    };
  }
}; 