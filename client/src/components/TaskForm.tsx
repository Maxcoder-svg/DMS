import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Task, ChecklistItem, DailySchedule } from '../types';
import { Plus, Trash2, Clock } from 'lucide-react';

function TaskForm() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isEditing = Boolean(taskId);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    durationDays: 98,
    startDate: new Date().toISOString().split('T')[0],
  });

  const [checklistItems, setChecklistItems] = useState<Omit<ChecklistItem, 'id' | 'task_id' | 'is_completed' | 'completed_at' | 'created_at' | 'updated_at'>[]>([
    { title: '', description: '', order_index: 0 }
  ]);

  const [schedules, setSchedules] = useState<Omit<DailySchedule, 'id' | 'task_id' | 'is_active' | 'created_at' | 'updated_at'>[]>([
    { time: '09:00', days_of_week: '1,2,3,4,5,6,7' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && taskId) {
      fetchTask();
    }
  }, [isEditing, taskId]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      const task: Task = response.data.task;

      setFormData({
        title: task.title,
        description: task.description || '',
        durationDays: task.duration_days,
        startDate: task.start_date,
      });

      setChecklistItems(task.checklistItems.map(item => ({
        title: item.title,
        description: item.description || '',
        order_index: item.order_index
      })));

      setSchedules(task.schedules.map(schedule => ({
        time: schedule.time,
        days_of_week: schedule.days_of_week
      })));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch task');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'durationDays' ? parseInt(value) || 1 : value
    }));
  };

  const handleChecklistItemChange = (index: number, field: keyof typeof checklistItems[0], value: string) => {
    setChecklistItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addChecklistItem = () => {
    setChecklistItems(prev => [
      ...prev,
      { title: '', description: '', order_index: prev.length }
    ]);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index: number, field: keyof typeof schedules[0], value: string) => {
    setSchedules(prev => prev.map((schedule, i) => 
      i === index ? { ...schedule, [field]: value } : schedule
    ));
  };

  const addSchedule = () => {
    setSchedules(prev => [
      ...prev,
      { time: '09:00', days_of_week: '1,2,3,4,5,6,7' }
    ]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== index));
  };

  const getDayName = (dayNumber: string) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[parseInt(dayNumber) - 1];
  };

  const handleDayToggle = (scheduleIndex: number, dayNumber: string) => {
    setSchedules(prev => prev.map((schedule, i) => {
      if (i !== scheduleIndex) return schedule;
      
      const days = schedule.days_of_week.split(',');
      const newDays = days.includes(dayNumber) 
        ? days.filter(d => d !== dayNumber)
        : [...days, dayNumber];
      
      return { ...schedule, days_of_week: newDays.sort().join(',') };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        checklistItems: checklistItems.filter(item => item.title.trim()),
        schedules: schedules.filter(schedule => schedule.time)
      };

      if (isEditing) {
        await api.put(`/tasks/${taskId}`, payload);
      } else {
        await api.post('/tasks', payload);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-form-container">
      <div className="task-form">
        <h1>{isEditing ? 'Edit Task' : 'Create New Task'}</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., Daily Exercise Routine"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your task and goals..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="durationDays">Duration (days)</label>
              <input
                type="number"
                id="durationDays"
                name="durationDays"
                value={formData.durationDays}
                onChange={handleInputChange}
                min="1"
                max="365"
              />
              <small>Default is 98 days for habit formation</small>
            </div>

            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Checklist Items</h3>
              <button type="button" onClick={addChecklistItem} className="btn btn-secondary btn-sm">
                <Plus size={16} />
                Add Item
              </button>
            </div>

            {checklistItems.map((item, index) => (
              <div key={index} className="checklist-item">
                <div className="form-row">
                  <div className="form-group flex-grow">
                    <input
                      type="text"
                      placeholder="Checklist item title"
                      value={item.title}
                      onChange={(e) => handleChecklistItemChange(index, 'title', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(index)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Optional description"
                    value={item.description}
                    onChange={(e) => handleChecklistItemChange(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Reminder Schedule</h3>
              <button type="button" onClick={addSchedule} className="btn btn-secondary btn-sm">
                <Clock size={16} />
                Add Schedule
              </button>
            </div>

            {schedules.map((schedule, index) => (
              <div key={index} className="schedule-item">
                <div className="form-row">
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(e) => handleScheduleChange(index, 'time', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSchedule(index)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="form-group">
                  <label>Days of Week</label>
                  <div className="day-selector">
                    {['1', '2', '3', '4', '5', '6', '7'].map(dayNum => (
                      <button
                        key={dayNum}
                        type="button"
                        className={`day-btn ${schedule.days_of_week.includes(dayNum) ? 'active' : ''}`}
                        onClick={() => handleDayToggle(index, dayNum)}
                      >
                        {getDayName(dayNum)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskForm;