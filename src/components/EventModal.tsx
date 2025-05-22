import React, { useState } from 'react';
import { format } from 'date-fns';
import { EventType } from '../types';
import './EventModal.css';

interface EventModalProps {
  event: EventType;
  onClose: () => void;
  onUpdate: (event: EventType) => void;
  onDelete: (eventId: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [startDate, setStartDate] = useState(format(new Date(event.start), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(format(new Date(event.start), 'HH:mm'));
  const [endDate, setEndDate] = useState(format(new Date(event.end), 'yyyy-MM-dd'));
  const [endTime, setEndTime] = useState(format(new Date(event.end), 'HH:mm'));
  const [location, setLocation] = useState(event.location || '');
  const [color, setColor] = useState(event.color || '#4285f4');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedEvent: EventType = {
      ...event,
      title,
      description: description.trim() ? description : undefined,
      start: new Date(`${startDate}T${startTime}`),
      end: new Date(`${endDate}T${endTime}`),
      location: location.trim() ? location : undefined,
      color
    };
    
    onUpdate(updatedEvent);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除此事件吗？')) {
      onDelete(event.id);
      onClose();
    }
  };

  const renderViewMode = () => (
    <div className="event-details">
      <h2>{event.title}</h2>
      
      <div className="event-detail">
        <span className="icon">🕒</span>
        <span className="detail-text">
          {format(new Date(event.start), 'yyyy年MM月dd日 HH:mm')} - {format(new Date(event.end), 'HH:mm')}
        </span>
      </div>
      
      {event.location && (
        <div className="event-detail">
          <span className="icon">📍</span>
          <span className="detail-text">{event.location}</span>
        </div>
      )}
      
      {event.description && (
        <div className="event-description">
          <h3>描述</h3>
          <p>{event.description}</p>
        </div>
      )}
      
      <div className="color-indicator" style={{ backgroundColor: event.color || '#4285f4' }}></div>
      
      <div className="event-modal-actions">
        <button onClick={() => setIsEditing(true)} className="edit-button">编辑</button>
        <button onClick={handleDelete} className="delete-button">删除</button>
      </div>
    </div>
  );

  const renderEditMode = () => (
    <form onSubmit={handleSubmit} className="event-form">
      <div className="form-group">
        <label htmlFor="title">标题</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startDate">开始日期</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="startTime">开始时间</label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="endDate">结束日期</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="endTime">结束时间</label>
          <input
            type="time"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="location">地点</label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">描述</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        ></textarea>
      </div>
      
      <div className="form-group">
        <label htmlFor="color">颜色</label>
        <input
          type="color"
          id="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      
      <div className="event-modal-actions">
        <button type="submit" className="save-button">保存</button>
        <button type="button" onClick={() => setIsEditing(false)} className="cancel-button">取消</button>
      </div>
    </form>
  );

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        {isEditing ? renderEditMode() : renderViewMode()}
      </div>
    </div>
  );
};

export default EventModal; 