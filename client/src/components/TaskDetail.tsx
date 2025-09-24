import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Task, TaskProgress } from '../types';
import { Calendar, Clock, CheckSquare, Edit, Trash2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

  useEffect(() => {
    if (taskId) {
      fetchTaskDetail();
      fetchTaskProgress();
    }
  }, [taskId]);

  const fetchTaskDetail = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data.task);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch task details');
    }
  };

  const fetchTaskProgress = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}/progress`);
      setProgress(response.data);
    } catch (err: any) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklistItem = async (itemId: number, isCompleted: boolean) => {
    setUpdatingItem(itemId);
    try {
      await api.put(`/tasks/${taskId}/checklist/${itemId}`, {
        isCompleted: !isCompleted
      });
      
      // Refresh task data
      await fetchTaskDetail();
      await fetchTaskProgress();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update checklist item');
    } finally {
      setUpdatingItem(null);
    }
  };

  const deleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      case 'paused':
        return 'status-paused';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="loading">Loading task details...</div>;
  }

  if (!task) {
    return <div className="error-message">Task not found</div>;
  }

  return (
    <div className="task-detail">
      {error && <div className="error-message">{error}</div>}

      <div className="task-header">
        <div className="task-title-section">
          <h1>{task.title}</h1>
          <span className={`status-badge ${task.status} ${getStatusClass(task.status)}`}>
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </span>
        </div>

        <div className="task-actions">
          <button
            onClick={() => navigate(`/tasks/${task.id}/edit`)}
            className="btn btn-secondary"
            disabled={task.status === 'completed' || task.status === 'failed'}
          >
            <Edit size={16} />
            Edit
          </button>
          <button onClick={deleteTask} className="btn btn-danger">
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {task.description && (
        <div className="task-description">
          <p>{task.description}</p>
        </div>
      )}

      <div className="task-meta-grid">
        <div className="meta-card">
          <Calendar size={20} />
          <div>
            <strong>Duration</strong>
            <p>
              {format(new Date(task.start_date), 'MMM d, yyyy')} - {format(new Date(task.end_date), 'MMM d, yyyy')}
              <br />
              <small>{task.duration_days} days total</small>
            </p>
          </div>
        </div>

        {progress && (
          <div className="meta-card">
            <TrendingUp size={20} />
            <div>
              <strong>Progress</strong>
              <p>
                {progress.completionPercentage}% complete
                <br />
                <small>{progress.daysRemaining} days remaining</small>
              </p>
            </div>
          </div>
        )}
      </div>

      {task.schedules.length > 0 && (
        <div className="schedules-section">
          <h3>
            <Clock size={20} />
            Reminder Schedule
          </h3>
          <div className="schedules-list">
            {task.schedules.map(schedule => (
              <div key={schedule.id} className="schedule-item">
                <strong>{schedule.time}</strong>
                <span>
                  Days: {schedule.days_of_week.split(',').map(day => {
                    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    return days[parseInt(day) - 1];
                  }).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="checklist-section">
        <h3>
          <CheckSquare size={20} />
          Daily Checklist
        </h3>

        {task.checklistItems.length === 0 ? (
          <p className="empty-checklist">No checklist items added.</p>
        ) : (
          <div className="checklist-items">
            {task.checklistItems.map((item, index) => (
              <div
                key={item.id}
                className={`checklist-item ${item.is_completed ? 'completed' : ''}`}
              >
                <div className="item-content">
                  <button
                    className="checkbox"
                    onClick={() => toggleChecklistItem(item.id, item.is_completed)}
                    disabled={updatingItem === item.id || task.status === 'completed' || task.status === 'failed'}
                  >
                    {updatingItem === item.id ? (
                      <div className="spinner"></div>
                    ) : item.is_completed ? (
                      '✓'
                    ) : (
                      ''
                    )}
                  </button>
                  
                  <div className="item-text">
                    <h4>{item.title}</h4>
                    {item.description && <p>{item.description}</p>}
                    {item.completed_at && (
                      <small className="completion-time">
                        Completed: {format(new Date(item.completed_at), 'MMM d, h:mm a')}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {progress && progress.dailyProgress.length > 0 && (
        <div className="progress-section">
          <h3>
            <TrendingUp size={20} />
            Daily Progress
          </h3>
          <div className="progress-chart">
            {progress.dailyProgress.slice(-14).map((day, index) => {
              const completionRate = day.total > 0 ? (day.completed / day.total) * 100 : 0;
              return (
                <div key={index} className="progress-bar-container">
                  <div className="progress-date">
                    {format(new Date(day.date), 'MMM d')}
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ height: `${completionRate}%` }}
                    ></div>
                  </div>
                  <div className="progress-stats">
                    {day.completed}/{day.total}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskDetail;