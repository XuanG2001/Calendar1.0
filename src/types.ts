export interface EventType {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color?: string;
  location?: string;
  coordinates?: {
    longitude: number;
    latitude: number;
  };
  address?: string; // 格式化地址
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  events?: EventType[];
  suggestions?: string[];
  type?: 'query' | 'create';
  queryRange?: {
    start: string;
    end: string;
  };
}

// 添加地图相关类型
export interface RouteInfo {
  distance?: number; // 距离（米）
  duration?: number; // 时间（秒）
  routeType: 'walking' | 'transit' | 'driving';
  steps?: string[];
  polyline?: [number, number][]; // 路径点坐标
} 