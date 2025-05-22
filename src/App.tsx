import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import ChatInterface from './components/ChatInterface';
import { EventType } from './types';

const App: React.FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 从本地存储加载事件
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar-events');
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        setEvents(parsedEvents);
      } catch (error) {
        console.error('加载事件失败:', error);
      }
    }
  }, []);

  // 保存事件到本地存储
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('calendar-events', JSON.stringify(events));
    }
  }, [events]);

  // 添加新事件
  const addEvent = (newEvent: EventType) => {
    setEvents([...events, newEvent]);
  };

  // 更新事件
  const updateEvent = (updatedEvent: EventType) => {
    setEvents(events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
  };

  // 删除事件
  const deleteEvent = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  return (
    <div className="app-container">
      <div className="calendar-container">
        <Calendar 
          events={events}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onUpdateEvent={updateEvent}
          onDeleteEvent={deleteEvent}
        />
      </div>
      <div className="chat-container">
        <ChatInterface 
          events={events}
          addEvent={addEvent}
          updateEvent={updateEvent}
          deleteEvent={deleteEvent}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
};

export default App; 