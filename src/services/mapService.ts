import AMapLoader from '@amap/amap-jsapi-loader';

// 地图实例
let map: any = null;

// 初始化地图
export const initMap = async (container: string) => {
  try {
    const AMap = await AMapLoader.load({
      key: '4afe94fd9ff07c2b19cb4e291e4613b5', // JS API 密钥
      version: '2.0',
      plugins: ['AMap.Geocoder', 'AMap.Marker']
    });

    map = new AMap.Map(container, {
      zoom: 11,
      center: [116.397428, 39.90923],
    });

    return map;
  } catch (error) {
    console.error('地图初始化失败:', error);
    throw new Error('地图初始化失败');
  }
};

// 获取地图实例
export const getMap = () => map;

// 地理编码
export const geocode = async (address: string): Promise<[number, number]> => {
  try {
    const response = await fetch(`/.netlify/functions/geocode?type=geo&address=${encodeURIComponent(address)}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.geocodes || data.geocodes.length === 0) {
      throw new Error(`无法获取地址'${address}'的坐标`);
    }

    const location = data.geocodes[0].location.split(',');
    return [parseFloat(location[0]), parseFloat(location[1])];
  } catch (error) {
    console.error('地理编码失败:', error);
    throw error;
  }
};

// 逆地理编码
export const reverseGeocode = async (longitude: number, latitude: number): Promise<string> => {
  try {
    const response = await fetch(`/.netlify/functions/geocode?type=regeo&longitude=${longitude}&latitude=${latitude}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.regeocode) {
      throw new Error('无法获取该坐标的地址信息');
    }

    return data.regeocode.formatted_address;
  } catch (error) {
    console.error('逆地理编码失败:', error);
    throw error;
  }
}; 