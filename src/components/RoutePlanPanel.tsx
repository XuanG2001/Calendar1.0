import React, { useEffect, useState } from 'react';
import { Card, Tabs, List, Tag, Button, Spin } from 'antd';
import { EnvironmentOutlined, CarOutlined, GlobalOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { EventType, RouteInfo } from '../types';
import { getRoutePlan } from '../services/routeService';
import './RoutePlanPanel.css';

interface RoutePlanPanelProps {
  events: EventType[];
  onShowRoute?: (polyline: [number, number][]) => void;
}

interface RouteSegment {
  from: EventType;
  to: EventType;
  routes: {
    walking: RouteInfo;
    driving: RouteInfo;
    transit: RouteInfo;
  };
  suggestion: string;
}

const RoutePlanPanel: React.FC<RoutePlanPanelProps> = ({ events, onShowRoute }) => {
  const [loading, setLoading] = useState(false);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);

  useEffect(() => {
    if (events.length >= 2) {
      loadRoutePlan();
    }
  }, [events]);

  const loadRoutePlan = async () => {
    setLoading(true);
    try {
      const { routes, suggestions } = await getRoutePlan(events);
      
      // 组织路段数据
      const segments: RouteSegment[] = [];
      for (let i = 0; i < events.length - 1; i++) {
        const baseIndex = i * 3; // 每个段有3种路线（步行、驾车、公交）
        segments.push({
          from: events[i],
          to: events[i + 1],
          routes: {
            walking: routes[baseIndex],
            driving: routes[baseIndex + 1],
            transit: routes[baseIndex + 2]
          },
          suggestion: suggestions[i]
        });
      }
      setRouteSegments(segments);
    } catch (error) {
      console.error('加载路径规划失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const formatDistance = (meters: number) => {
    return meters >= 1000 
      ? `${(meters / 1000).toFixed(1)}公里`
      : `${Math.round(meters)}米`;
  };

  const renderRouteInfo = (route: RouteInfo) => {
    if (!route) return null;

    return (
      <div className="route-info">
        <div className="route-stats">
          <span>用时：{formatDuration(route.duration || 0)}</span>
          <span>距离：{formatDistance(route.distance || 0)}</span>
        </div>
        <div className="route-steps">
          {route.steps?.map((step, index) => (
            <div key={index} className="route-step">{step}</div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="route-plan-loading">
        <Spin tip="正在规划路线..." />
      </div>
    );
  }

  if (events.length < 2) {
    return (
      <Card className="route-plan-panel">
        <div className="no-routes">
          需要至少两个带有位置信息的事件才能规划路线
        </div>
      </Card>
    );
  }

  return (
    <Card className="route-plan-panel" title="路线规划">
      <List
        dataSource={routeSegments}
        renderItem={(segment: RouteSegment, index: number) => (
          <List.Item className="route-segment">
            <div className="segment-header">
              <div className="segment-title">
                {format(new Date(segment.from.end), 'HH:mm', { locale: zhCN })} → {format(new Date(segment.to.start), 'HH:mm', { locale: zhCN })}
              </div>
              <div className="segment-locations">
                {segment.from.location} → {segment.to.location}
              </div>
            </div>
            
            <div className="segment-suggestion">
              <Tag color="blue">建议</Tag>
              {segment.suggestion}
            </div>

            <Tabs
              defaultActiveKey="walking"
              items={[
                {
                  key: 'walking',
                  label: (
                    <span>
                      <EnvironmentOutlined /> 步行
                    </span>
                  ),
                  children: renderRouteInfo(segment.routes.walking)
                },
                {
                  key: 'transit',
                  label: (
                    <span>
                      <GlobalOutlined /> 公交
                    </span>
                  ),
                  children: renderRouteInfo(segment.routes.transit)
                },
                {
                  key: 'driving',
                  label: (
                    <span>
                      <CarOutlined /> 驾车
                    </span>
                  ),
                  children: renderRouteInfo(segment.routes.driving)
                }
              ]}
              onChange={(key: string) => {
                const route = segment.routes[key as keyof typeof segment.routes];
                if (route && onShowRoute) {
                  onShowRoute(route.polyline || []);
                }
              }}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default RoutePlanPanel; 