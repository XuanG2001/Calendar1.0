const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const API_KEY = process.env.AMAP_API_KEY;
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: '未配置高德地图 API 密钥' })
      };
    }

    // 解析请求参数
    const params = event.queryStringParameters;
    const { type, address, longitude, latitude } = params;

    if (!type || (type === 'geo' && !address) || (type === 'regeo' && (!longitude || !latitude))) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: '缺少必要的参数' })
      };
    }

    let url;
    if (type === 'geo') {
      // 地理编码
      url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&city=北京&key=${API_KEY}&output=JSON`;
    } else if (type === 'regeo') {
      // 逆地理编码
      url = `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=${API_KEY}`;
    } else {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: '无效的请求类型' })
      };
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== '1') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: '地理编码服务错误',
          message: data.info || '未知错误'
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('地理编码服务错误:', error);
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