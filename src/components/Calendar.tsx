import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { EventType } from '../types';
import EventModal from './EventModal';
import './Calendar.css';

interface CalendarProps {
  events: EventType[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onUpdateEvent: (event: EventType) => void;
  onDeleteEvent: (eventId: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ 
  events, 
  selectedDate, 
  setSelectedDate, 
  onUpdateEvent, 
  onDeleteEvent 
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 前一个月
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // 后一个月
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // 渲染日历头部
  const renderHeader = () => {
    return (
      <div className="calendar-header">
        <button onClick={prevMonth}>&lt;</button>
        <h2>{format(currentMonth, 'yyyy年MM月', { locale: zhCN })}</h2>
        <button onClick={nextMonth}>&gt;</button>
      </div>
    );
  };

  // 渲染星期行
  const renderDays = () => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return (
      <div className="days-row">
        {days.map(day => (
          <div className="day-name" key={day}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  // 渲染单元格
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = monthStart;
    const endDate = monthEnd;

    const dateRange = eachDayOfInterval({
      start: startDate,
      end: endDate
    });

    // 找出当前日期的事件
    const getEventsForDate = (date: Date) => {
      return events.filter(event => 
        isSameDay(date, new Date(event.start))
      );
    };

    // 填充日期单元格
    const rows = [];
    let days = [];
    let day = 1;

    // 填充前置空白单元格
    const firstDayOfMonth = monthStart.getDay();
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div className="day-cell empty" key={`empty-${i}`}></div>
      );
    }

    // 填充日期单元格
    for (let d of dateRange) {
      const formattedDate = format(d, 'd');
      const dayEvents = getEventsForDate(d);
      const isSelected = isSameDay(d, selectedDate);
      const isToday = isSameDay(d, new Date());

      days.push(
        <div
          className={`day-cell ${!isSameMonth(d, monthStart) ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          key={d.toString()}
          onClick={() => setSelectedDate(d)}
        >
          <div className="day-number">{formattedDate}</div>
          <div className="day-events">
            {dayEvents.slice(0, 3).map(event => (
              <div 
                className="event-pill" 
                key={event.id}
                style={{ backgroundColor: event.color || '#4285f4' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setIsModalOpen(true);
                }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="more-events">+{dayEvents.length - 3}更多</div>
            )}
          </div>
        </div>
      );

      if (days.length === 7) {
        rows.push(
          <div className="days-row" key={`row-${day}`}>
            {days}
          </div>
        );
        days = [];
      }
      day++;
    }

    // 填充剩余的行
    if (days.length > 0) {
      while (days.length < 7) {
        days.push(
          <div className="day-cell empty" key={`empty-end-${days.length}`}></div>
        );
      }
      rows.push(
        <div className="days-row" key={`row-${day}`}>
          {days}
        </div>
      );
    }

    return <div className="calendar-body">{rows}</div>;
  };

  // 渲染日程详情
  const renderEvents = () => {
    const dayEvents = events.filter(event => 
      isSameDay(selectedDate, new Date(event.start))
    );

    if (dayEvents.length === 0) {
      return <div className="no-events">今天没有日程安排</div>;
    }

    return (
      <div className="day-events-list">
        <h3>{format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })}的日程</h3>
        {dayEvents.map(event => (
          <div 
            className="event-item" 
            key={event.id}
            onClick={() => {
              setSelectedEvent(event);
              setIsModalOpen(true);
            }}
          >
            <div className="event-time">
              {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
            </div>
            <div className="event-title" style={{ borderLeft: `4px solid ${event.color || '#4285f4'}` }}>
              {event.title}
            </div>
            {event.location && (
              <div className="event-location">📍 {event.location}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="calendar">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      <div className="events-container">
        {renderEvents()}
      </div>
      
      {isModalOpen && selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setIsModalOpen(false)}
          onUpdate={onUpdateEvent}
          onDelete={onDeleteEvent}
        />
      )}
    </div>
  );
};

export default Calendar; 