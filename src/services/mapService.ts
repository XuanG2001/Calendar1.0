// 高德地图 Web API 密钥
const API_KEY = '4afe94fd9ff07c2b19cb4e291e4613b5';

// 地理编码服务
export const geocode = async (address: string): Promise<[number, number]> => {
  try {
    // 构建地理编码 API URL，添加城市参数
    const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&city=北京&key=${API_KEY}&output=JSON`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      // 获取第一个结果的经纬度
      const location = data.geocodes[0].location;
      const [longitude, latitude] = location.split(',').map(Number);
      
      // 验证坐标有效性
      if (isNaN(longitude) || isNaN(latitude)) {
        throw new Error(`无效的坐标值: ${location}`);
      }
      
      console.log(`地理编码成功: ${address} => [${longitude}, ${latitude}]`);
      console.log('完整地址:', data.geocodes[0].formatted_address);
      return [longitude, latitude];
    } else {
      console.error('地理编码失败:', data);
      throw new Error(`无法获取地址 "${address}" 的坐标`);
    }
  } catch (error) {
    console.error('地理编码服务错误:', error);
    throw error;
  }
};

// 逆地理编码服务
export const reverseGeocode = async (longitude: number, latitude: number): Promise<string> => {
  try {
    // 构建逆地理编码 API URL
    const url = `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.regeocode) {
      const address = data.regeocode.formatted_address;
      console.log(`逆地理编码成功: [${longitude}, ${latitude}] => ${address}`);
      return address;
    } else {
      console.error('逆地理编码失败:', data);
      throw new Error(`无法获取坐标 [${longitude}, ${latitude}] 的地址`);
    }
  } catch (error) {
    console.error('逆地理编码服务错误:', error);
    throw error;
  }
}; 