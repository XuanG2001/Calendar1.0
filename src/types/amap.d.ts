declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, options?: MapOptions);
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    destroy(): void;
    setCenter(position: [number, number]): void;
    setZoom(zoom: number): void;
    getCenter(): LngLat;
    getZoom(): number;
    addControl(control: any): void;
    removeControl(control: any): void;
    clearMap(): void;
  }

  class Marker {
    constructor(options: MarkerOptions);
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    setMap(map: Map | null): void;
    setPosition(position: [number, number] | LngLat): void;
    getPosition(): LngLat;
    setLabel(label: { content: string }): void;
    setContent(content: string | HTMLElement): void;
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions);
    open(map: Map, position: [number, number] | LngLat): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
  }

  interface MapOptions {
    zoom?: number;
    center?: LngLat;
    viewMode?: '2D' | '3D';
    pitch?: number;
    mapStyle?: string;
  }

  interface MarkerOptions {
    position: [number, number] | LngLat;
    title?: string;
    label?: { content: string };
    content?: string | HTMLElement;
    offset?: [number, number] | Pixel;
    anchor?: string;
    clickable?: boolean;
    draggable?: boolean;
    visible?: boolean;
    zIndex?: number;
    animation?: string;
    extData?: any;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    position?: [number, number] | LngLat;
    offset?: [number, number] | Pixel;
    anchor?: string;
    size?: Size;
    autoMove?: boolean;
    closeWhenClickMap?: boolean;
  }

  class LngLat {
    constructor(lng: number, lat: number);
    getLng(): number;
    getLat(): number;
  }

  class Pixel {
    constructor(x: number, y: number);
    getX(): number;
    getY(): number;
  }

  class Size {
    constructor(width: number, height: number);
    getWidth(): number;
    getHeight(): number;
  }

  namespace DrivingPolicy {
    const LEAST_TIME: number;
  }

  namespace TransferPolicy {
    const LEAST_TIME: number;
  }

  interface SearchCallback {
    (status: string, result: any): void;
  }

  interface RouteOptions {
    map: Map | null;
    hideMarkers?: boolean;
    policy?: number;
    city?: string;
  }

  interface Walking {
    constructor(options: RouteOptions);
    search(origin: LngLat, destination: LngLat, callback: SearchCallback): void;
  }

  interface Driving {
    constructor(options: RouteOptions);
    search(origin: LngLat, destination: LngLat, callback: SearchCallback): void;
  }

  interface Transfer {
    constructor(options: RouteOptions);
    search(origin: LngLat, destination: LngLat, callback: SearchCallback): void;
  }

  function plugin(name: string, callback: () => void): void;
}

declare global {
  interface Window {
    AMap: typeof AMap;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
} 