import { EventType, RouteInfo } from '../types';

// 高德地图 Web 服务 API 密钥
const API_KEY = '4afe94fd9ff07c2b19cb4e291e4613b5';

// 计算两个事件之间的路径
export const calculateRoute = async (
  origin: { longitude: number; latitude: number },
  destination: { longitude: number; latitude: number },
  type: 'walking' | 'driving' | 'transit'
): Promise<RouteInfo> => {
  try {
    // 构建路径规划 API URL
    const baseUrl = 'https://restapi.amap.com/v3/direction';
    const originStr = `${origin.longitude},${origin.latitude}`;
    const destinationStr = `${destination.longitude},${destination.latitude}`;
    
    let url: string;
    switch (type) {
      case 'walking':
        url = `${baseUrl}/walking?origin=${originStr}&destination=${destinationStr}&key=${API_KEY}`;
        break;
      case 'driving':
        url = `${baseUrl}/driving?origin=${originStr}&destination=${destinationStr}&key=${API_KEY}&strategy=0&extensions=base`;
        break;
      case 'transit':
        url = `${baseUrl}/transit/integrated?origin=${originStr}&destination=${destinationStr}&key=${API_KEY}&city=北京&strategy=0&extensions=base`;
        break;
      default:
        throw new Error('无效的路径规划类型');
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1') {
      let routeInfo: RouteInfo;

      switch (type) {
        case 'walking':
          if (data.route && data.route.paths && data.route.paths.length > 0) {
            const path = data.route.paths[0];
            routeInfo = {
              distance: parseFloat(path.distance),
              duration: parseFloat(path.duration),
              routeType: type,
              steps: path.steps.map((step: any) => step.instruction),
              polyline: path.steps.reduce((acc: [number, number][], step: any) => {
                if (step.polyline) {
                  const points = step.polyline.split(';').map((point: string) => {
                    const [lng, lat] = point.split(',').map(Number);
                    return [lng, lat] as [number, number];
                  });
                  return [...acc, ...points];
                }
                return acc;
              }, [])
            };
          } else {
            throw new Error('未找到步行路径');
          }
          break;

        case 'driving':
          if (data.route && data.route.paths && data.route.paths.length > 0) {
            const path = data.route.paths[0];
            routeInfo = {
              distance: parseFloat(path.distance),
              duration: parseFloat(path.duration),
              routeType: type,
              steps: path.steps.map((step: any) => step.instruction),
              polyline: path.steps.reduce((acc: [number, number][], step: any) => {
                if (step.polyline) {
                  const points = step.polyline.split(';').map((point: string) => {
                    const [lng, lat] = point.split(',').map(Number);
                    return [lng, lat] as [number, number];
                  });
                  return [...acc, ...points];
                }
                return acc;
              }, [])
            };
          } else {
            throw new Error('未找到驾车路径');
          }
          break;

        case 'transit':
          if (data.route && data.route.transits && data.route.transits.length > 0) {
            const transit = data.route.transits[0];
            routeInfo = {
              distance: parseFloat(transit.distance),
              duration: parseFloat(transit.duration),
              routeType: type,
              steps: transit.segments.reduce((acc: string[], segment: any) => {
                const instructions: string[] = [];
                if (segment.walking && segment.walking.steps) {
                  instructions.push(...segment.walking.steps.map((step: any) => step.instruction));
                }
                if (segment.bus && segment.bus.buslines && segment.bus.buslines.length > 0) {
                  const busline = segment.bus.buslines[0];
                  instructions.push(`乘坐 ${busline.name}，从 ${busline.departure_stop.name} 到 ${busline.arrival_stop.name}`);
                }
                return [...acc, ...instructions];
              }, []),
              polyline: transit.segments.reduce((acc: [number, number][], segment: any) => {
                let points: [number, number][] = [];
                if (segment.walking && segment.walking.steps) {
                  points = segment.walking.steps.reduce((walkAcc: [number, number][], step: any) => {
                    if (step.polyline) {
                      const stepPoints = step.polyline.split(';').map((point: string) => {
                        const [lng, lat] = point.split(',').map(Number);
                        return [lng, lat] as [number, number];
                      });
                      return [...walkAcc, ...stepPoints];
                    }
                    return walkAcc;
                  }, []);
                }
                if (segment.bus && segment.bus.buslines && segment.bus.buslines.length > 0) {
                  const busline = segment.bus.buslines[0];
                  if (busline.polyline) {
                    const busPoints = busline.polyline.split(';').map((point: string) => {
                      const [lng, lat] = point.split(',').map(Number);
                      return [lng, lat] as [number, number];
                    });
                    points = [...points, ...busPoints];
                  }
                }
                return [...acc, ...points];
              }, [])
            };
          } else {
            throw new Error('未找到公交路径');
          }
          break;

        default:
          throw new Error('无效的路径规划类型');
      }

      return routeInfo;
    } else {
      console.error('路径规划失败:', data);
      throw new Error(`路径规划失败: ${data.info || '未知错误'}`);
    }
  } catch (error) {
    console.error('路径计算错误:', error);
    throw error;
  }
};

// 获取所有事件之间的路径规划
export const getRoutePlan = async (events: EventType[]): Promise<{
  routes: RouteInfo[];
  suggestions: string[];
}> => {
  if (!events || events.length < 2) {
    return { routes: [], suggestions: [] };
  }

  // 按时间排序
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const routes: RouteInfo[] = [];
  const suggestions: string[] = [];

  // 计算相邻事件之间的路径
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEvent = sortedEvents[i];
    const nextEvent = sortedEvents[i + 1];

    if (!currentEvent.coordinates || !nextEvent.coordinates) {
      continue;
    }

    try {
      // 获取三种出行方式的路径
      const [walkingRoute, drivingRoute, transitRoute] = await Promise.all([
        calculateRoute(currentEvent.coordinates, nextEvent.coordinates, 'walking'),
        calculateRoute(currentEvent.coordinates, nextEvent.coordinates, 'driving'),
        calculateRoute(currentEvent.coordinates, nextEvent.coordinates, 'transit')
      ]);

      routes.push(walkingRoute, drivingRoute, transitRoute);

      // 计算两个事件之间的时间间隔（分钟）
      const timeBetweenEvents = 
        (new Date(nextEvent.start).getTime() - new Date(currentEvent.end).getTime()) / 60000;

      // 生成出行建议
      const suggestion = generateTravelSuggestion(
        walkingRoute,
        drivingRoute,
        transitRoute,
        timeBetweenEvents
      );
      suggestions.push(suggestion);
    } catch (error) {
      console.error('获取路径失败:', error);
      routes.push(
        { routeType: 'walking', distance: 0, duration: 0, steps: [], polyline: [] },
        { routeType: 'driving', distance: 0, duration: 0, steps: [], polyline: [] },
        { routeType: 'transit', distance: 0, duration: 0, steps: [], polyline: [] }
      );
      suggestions.push('抱歉，无法获取路线信息');
    }
  }

  return { routes, suggestions };
};

// 生成出行建议
const generateTravelSuggestion = (
  walkingRoute: RouteInfo,
  drivingRoute: RouteInfo,
  transitRoute: RouteInfo,
  timeBetweenEvents: number
): string => {
  const walkingMinutes = Math.round((walkingRoute.duration || 0) / 60);
  const drivingMinutes = Math.round((drivingRoute.duration || 0) / 60);
  const transitMinutes = Math.round((transitRoute.duration || 0) / 60);
  const timeBuffer = 20; // 预留20分钟缓冲时间

  if ((walkingRoute.distance || 0) <= 1000 && timeBetweenEvents > walkingMinutes + timeBuffer) {
    return `建议步行前往，距离较近（${((walkingRoute.distance || 0) / 1000).toFixed(1)}km），步行${walkingMinutes}分钟可到达。`;
  } else if (timeBetweenEvents < Math.min(transitMinutes, drivingMinutes) + timeBuffer) {
    return `时间较紧张，建议打车前往，预计需要${drivingMinutes}分钟。`;
  } else if (transitMinutes < drivingMinutes * 1.5) {
    return `建议乘坐公交前往，预计需要${transitMinutes}分钟，比较经济环保。`;
  } else {
    return `建议驾车或打车前往，预计需要${drivingMinutes}分钟，可以节省时间。`;
  }
}; 