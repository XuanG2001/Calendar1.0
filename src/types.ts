export interface EventType {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color?: string;
  location?: string;
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
} 