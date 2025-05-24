import React, { useEffect, useRef, useState } from 'react';
import { EventType } from '../types';
import { format } from 'date-fns';
import './MapView.css';
import RoutePlanPanel from './RoutePlanPanel';

interface MapViewProps {
  events: EventType[];
  onEventClick?: (event: EventType) => void;
}

declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
    AMap: any;
    initAMap?: () => void;
  }
}

const MapView: React.FC<MapViewProps> = ({ events, onEventClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [infoWindow, setInfoWindow] = useState<any>(null);
  const [routePolyline, setRoutePolyline] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current || map) return;

    // 设置安全配置
    window._AMapSecurityConfig = {
      securityJsCode: '4afe94fd9ff07c2b19cb4e291e4613b5'
    };

    // 加载高德地图脚本
    const loadMap = () => {
      const script = document.createElement('script');
      script.src = 'https://webapi.amap.com/maps?v=2.0&key=4afe94fd9ff07c2b19cb4e291e4613b5&callback=initAMap';
      script.async = true;
      script.onerror = () => {
        console.error('地图脚本加载失败');
        setError('地图加载失败，请检查网络连接后刷新页面');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    // 定义初始化函数
    window.initAMap = () => {
      try {
        if (!mapRef.current) return;

        const newMap = new window.AMap.Map(mapRef.current, {
          zoom: 13,
          center: [116.397428, 39.90923], // 北京市中心
          viewMode: '2D'
        });

        const newInfoWindow = new window.AMap.InfoWindow({
          offset: new window.AMap.Pixel(0, -30),
          closeWhenClickMap: true
        });

        setMap(newMap);
        setInfoWindow(newInfoWindow);
        setIsLoading(false);
      } catch (err) {
        console.error('地图初始化失败:', err);
        setError('地图初始化失败，请刷新页面重试');
        setIsLoading(false);
      }
    };

    loadMap();

    return () => {
      if (map) {
        map.destroy();
      }
      // 清理全局回调
      if (window.initAMap) {
        window.initAMap = undefined;
      }
    };
  }, []);

  // 更新标记
  useEffect(() => {
    if (!map || !events.length) {
      console.log('地图未初始化或没有事件');
      return;
    }

    console.log('准备更新标记，事件列表：', events);

    // 清除现有标记
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    // 创建新标记
    const newMarkers = events
      .filter(event => {
        const hasCoordinates = event.coordinates && 
          !isNaN(event.coordinates.longitude) && 
          !isNaN(event.coordinates.latitude);
        console.log(`事件 "${event.title}" ${hasCoordinates ? '有' : '没有'}有效坐标:`, event.coordinates);
        return hasCoordinates;
      })
      .map(event => {
        console.log(`正在为事件 "${event.title}" 创建标记，坐标:`, event.coordinates);
        try {
          const position = new window.AMap.LngLat(
            event.coordinates!.longitude,
            event.coordinates!.latitude
          );
          console.log('成功创建 LngLat 对象:', position);
          
          // 创建标记
          const marker = new window.AMap.Marker({
            position: position,
            title: event.title,
            clickable: true
          });

          // 创建文字标记内容
          const markerContent = `
            <div class="map-marker-content">
              <div class="marker-icon"></div>
              <div class="marker-info">
                <div class="info-title">${event.title}</div>
                <div class="info-time">${format(new Date(event.start), 'HH:mm')}</div>
              </div>
            </div>
          `;

          // 设置标记的内容
          marker.setContent(markerContent);

          // 创建详细信息标签内容
          const labelContent = `
            <div class="map-hover-label">
              <div class="label-title">${event.title}</div>
              <div class="label-time">时间：${format(new Date(event.start), 'MM-dd HH:mm')} - ${format(new Date(event.end), 'HH:mm')}</div>
              ${event.location ? `<div class="label-location">地点：${event.location}</div>` : ''}
              ${event.description ? `<div class="label-desc">描述：${event.description}</div>` : ''}
            </div>
          `;

          // 创建文字标注
          const text = new window.AMap.Text({
            text: labelContent,
            anchor: 'bottom-center',
            offset: new window.AMap.Pixel(0, -55),
            style: {
              'background-color': 'transparent',
              'border': 'none',
              'padding': '0'
            }
          });

          // 默认隐藏文字标注
          text.hide();

          // 添加鼠标悬浮事件
          marker.on('mouseover', () => {
            text.setMap(map);
          });

          // 添加鼠标移出事件
          marker.on('mouseout', () => {
            text.setMap(null);
          });

          // 添加点击事件
          marker.on('click', () => {
            if (infoWindow) {
              const content = `
                <div class="map-info-window">
                  <h3>${event.title}</h3>
                  <p>时间：${format(new Date(event.start), 'MM-dd HH:mm')} - ${format(new Date(event.end), 'HH:mm')}</p>
                  ${event.location ? `<p>地点：${event.location}</p>` : ''}
                  ${event.description ? `<p>描述：${event.description}</p>` : ''}
                </div>
              `;
              infoWindow.setContent(content);
              infoWindow.open(map, position);
            }
            if (onEventClick) {
              onEventClick(event);
            }
          });

          marker.setMap(map);
          return { marker, text };
        } catch (error) {
          console.error(`创建标记失败，坐标值:`, event.coordinates, error);
          return null;
        }
      })
      .filter((item): item is { marker: any; text: any } => item !== null);

    console.log('创建的标记数量:', newMarkers.length);
    setMarkers(newMarkers.map(item => item.marker));

    // 如果有标记，调整地图视图以显示所有标记
    if (newMarkers.length > 0) {
      try {
        const firstMarker = newMarkers[0];
        if (firstMarker) {
          const position = firstMarker.marker.getPosition();
          if (position) {
            map.setCenter(position);
            map.setZoom(15); // 设置更大的缩放级别以更清晰地显示位置
          }
        }
      } catch (error) {
        console.error('设置地图中心点失败:', error);
      }
    }
  }, [map, events, infoWindow]);

  const handleShowRoute = (polyline: [number, number][]) => {
    // 清除已有的路线
    if (routePolyline) {
      routePolyline.setMap(null);
    }

    // 创建新的路线
    if (map && polyline.length > 0) {
      const path = polyline.map(([lng, lat]) => new window.AMap.LngLat(lng, lat));
      const newPolyline = new window.AMap.Polyline({
        path: path,
        strokeColor: '#1890FF',
        strokeWeight: 6,
        strokeOpacity: 0.8
      });
      newPolyline.setMap(map);
      setRoutePolyline(newPolyline);

      // 调整地图视野以显示整个路线
      map.setFitView([newPolyline]);
    }
  };

  return (
    <div className="map-container">
      <div ref={mapRef} className="map-view" />
      <RoutePlanPanel events={events} onShowRoute={handleShowRoute} />
      {isLoading && (
        <div className="map-loading">
          <p>地图加载中...</p>
        </div>
      )}
      {error && (
        <div className="map-error">
          <p>{error}</p>
        </div>
      )}
      {!isLoading && !error && !events.some(event => event.coordinates) && (
        <div className="map-no-markers">
          <p>当前没有可显示的标记</p>
        </div>
      )}
    </div>
  );
};

export default MapView; 