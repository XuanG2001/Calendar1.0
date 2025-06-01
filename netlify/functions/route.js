const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const API_KEY = process.env.AMAP_API_KEY;
    
    if (!API_KEY) {
      throw new Error('未配置高德地图 API 密钥');
    }

    // 解析请求参数
    const params = event.queryStringParameters;
    const { type, origin, destination } = params;

    if (!type || !origin || !destination) {
      throw new Error('缺少必要的参数');
    }

    const baseUrl = 'https://restapi.amap.com/v3/direction';
    let url;

    switch (type) {
      case 'walking':
        url = `${baseUrl}/walking?origin=${origin}&destination=${destination}&key=${API_KEY}`;
        break;
      case 'driving':
        url = `${baseUrl}/driving?origin=${origin}&destination=${destination}&key=${API_KEY}&strategy=0&extensions=base`;
        break;
      case 'transit':
        url = `${baseUrl}/transit/integrated?origin=${origin}&destination=${destination}&key=${API_KEY}&city=北京&strategy=0&extensions=base`;
        break;
      default:
        throw new Error('无效的路径规划类型');
    }

    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
}; 