import AMapLoader from '@amap/amap-jsapi-loader';

// 高德地图 Web 服务 API 密钥
const API_KEY = '4afe94fd9ff07c2b19cb4e291e4613b5';

// 声明全局类型
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

// 确保地图脚本已加载
const ensureMapLoaded = async (): Promise<void> => {
  try {
    // 如果已经加载完成且 Geocoder 存在，直接返回
    if (window.AMap && window.AMap.Geocoder) {
      return;
    }

    // 设置安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: '3dbda37e7510f62f15966d0b14c985d5'
    };

    // 使用 AMapLoader 加载地图
    await AMapLoader.load({
      key: API_KEY,
      version: '2.0',
      plugins: ['AMap.Geocoder']
    });

    if (!window.AMap || !window.AMap.Geocoder) {
      throw new Error('地图插件加载失败');
    }

    console.log('地图 Geocoder 插件加载完成');
  } catch (error) {
    console.error('地图初始化失败:', error);
    throw new Error('地图初始化失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
};

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