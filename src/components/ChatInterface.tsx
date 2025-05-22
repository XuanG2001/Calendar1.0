import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { EventType, Message } from '../types';
import { analyzeMessage } from '../services/aiService';
import './ChatInterface.css';

interface ChatInterfaceProps {
  events: EventType[];
  addEvent: (event: EventType) => void;
  updateEvent: (event: EventType) => void;
  deleteEvent: (eventId: string) => void;
  selectedDate: Date;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  events,
  addEvent,
  updateEvent,
  deleteEvent,
  selectedDate
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      text: '您好！我是您的AI日历助手。我可以帮您安排日程，只需告诉我您想要安排什么。',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 从本地存储加载消息历史
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat-messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error('加载消息历史失败:', error);
      }
    }
  }, []);

  // 保存消息到本地存储
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // 发送消息到AI并获取响应
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      id: uuidv4(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 调用AI服务
      const response = await analyzeMessage(input, events, selectedDate);
      
      // 添加AI回复
      const aiMessage: Message = {
        id: uuidv4(),
        text: response.message || '我理解了您的请求。',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 处理事件更改
      if (response.events && response.events.length > 0) {
        // 对于返回的每个事件，添加或更新
        response.events.forEach(event => {
          const existingEvent = events.find(e => e.id === event.id);
          if (existingEvent) {
            updateEvent(event);
          } else {
            addEvent({
              ...event,
              id: event.id || uuidv4()
            });
          }
        });
      }
    } catch (error) {
      console.error('AI处理失败:', error);
      // 添加错误消息
      const errorMessage: Message = {
        id: uuidv4(),
        text: '抱歉，处理您的请求时出现了问题。请稍后再试。',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理按键事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 清空聊天历史
  const clearChat = () => {
    if (window.confirm('确定要清空聊天记录吗？')) {
      setMessages([
        {
          id: uuidv4(),
          text: '您好！我是您的AI日历助手。我可以帮您安排日程，只需告诉我您想要安排什么。',
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>AI日程助手</h2>
        <button onClick={clearChat} className="clear-button">清空聊天</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-content">{message.text}</div>
            <div className="message-timestamp">
              {format(message.timestamp, 'HH:mm')}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai-message">
            <div className="message-content loading">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入您的日程安排需求..."
          disabled={isLoading}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={isLoading || !input.trim()}
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default ChatInterface; 