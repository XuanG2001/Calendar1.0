const fetch = require('node-fetch');

// 重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒
const TIMEOUT = 8000; // 8秒，留出余量给 Netlify Functions

// 延迟函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 带重试的 API 调用
const retryableApiCall = async (requestBody, apiKey, attempt = 1) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.log(`第 ${attempt} 次请求失败，${RETRY_DELAY/1000}秒后重试...`);
      await delay(RETRY_DELAY);
      return retryableApiCall(requestBody, apiKey, attempt + 1);
    }
    throw error;
  }
};

exports.handler = async function(event, context) {
  try {
    // 处理预检请求
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: '只支持 POST 请求' })
      };
    }

    const API_KEY = process.env.VOLCES_API_KEY;
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
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
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: '无效的请求体格式',
          details: error.message 
        })
      };
    }

    // 使用重试机制调用 API
    const response = await retryableApiCall(requestBody, API_KEY);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('AI 服务错误:', error);
    
    // 请求超时
    if (error.name === 'AbortError') {
      return {
        statusCode: 504,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: '请求超时',
          message: '服务器响应时间过长，请稍后重试'
        })
      };
    }

    // HTTP 错误
    if (error.message.includes('HTTP error!')) {
      const status = parseInt(error.message.match(/status: (\d+)/)[1]);
      const errorMessage = {
        502: 'AI 服务暂时不可用，请稍后重试',
        429: '请求过于频繁，请稍后重试',
        401: 'API 密钥无效或已过期',
        403: '没有访问权限'
      }[status] || '调用 AI 服务失败';

      return {
        statusCode: status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: errorMessage,
          status: status
        })
      };
    }

    // 网络错误
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        statusCode: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: '服务暂时不可用',
          message: '无法连接到 AI 服务器，请稍后重试'
        })
      };
    }

    // 其他错误
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: '服务器内部错误',
        message: error.message
      })
    };
  }
}; 