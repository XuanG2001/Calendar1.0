import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import ChatInterface from './components/ChatInterface';
import MapView from './components/MapView';
import { EventType } from './types';
import './App.css';

const App: React.FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showMap, setShowMap] = useState<boolean>(false);

  // 从本地存储加载事件
  useEffect(() => {
    const savedEvents = localStorage.getItem('events');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
      setEvents(parsedEvents);
    }
  }, []);

  // 保存事件到本地存储
  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  // 添加新事件
  const addEvent = (event: EventType) => {
    setEvents(prevEvents => [...prevEvents, event]);
  };

  // 更新事件
  const updateEvent = (updatedEvent: EventType) => {
    setEvents(prevEvents => 
      prevEvents.map(event => event.id === updatedEvent.id ? updatedEvent : event)
    );
  };

  // 删除事件
  const deleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  };

  // 切换视图
  const toggleView = () => {
    setShowMap(!showMap);
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>AI智能日历</h1>
        <button onClick={toggleView} className="view-toggle-btn">
          {showMap ? '切换到日历视图' : '切换到地图视图'}
        </button>
      </div>
      <div className="app-content">
        {showMap ? (
          <MapView 
            events={events}
            onEventClick={(event) => {
              setSelectedDate(new Date(event.start));
              setShowMap(false);
            }}
          />
        ) : (
          <div className="calendar-chat-container">
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
        )}
      </div>
    </div>
  );
};

export default App; 