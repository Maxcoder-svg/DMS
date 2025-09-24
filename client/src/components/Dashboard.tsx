import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Task } from '../types';
import { Calendar, Clock, CheckSquare, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';

function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusClass = (status: string) => {
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

  const calculateProgress = (task: Task) => {
    if (task.checklistItems.length === 0) return 0;
    const completed = task.checklistItems.filter(item => item.is_completed).length;
    return Math.round((completed / task.checklistItems.length) * 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div className="loading">Loading your tasks...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username}!</h1>
        <Link to="/tasks/new" className="btn btn-primary">
          <Plus size={18} />
          Create New Task
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Active Tasks</h3>
          <div className="stat-number">
            {tasks.filter(task => task.status === 'active').length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Completed Tasks</h3>
          <div className="stat-number">
            {tasks.filter(task => task.status === 'completed').length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <div className="stat-number">{tasks.length}</div>
        </div>
      </div>

      <div className="tasks-section">
        <h2>Your Tasks</h2>
        
        {tasks.length === 0 ? (
          <div className="empty-state">
            <CheckSquare size={64} className="empty-icon" />
            <h3>No tasks yet</h3>
            <p>Create your first task to start your discipline journey!</p>
            <Link to="/tasks/new" className="btn btn-primary">
              Create Your First Task
            </Link>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map(task => (
              <div key={task.id} className={`task-card ${getTaskStatusClass(task.status)}`}>
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span className={`status-badge ${task.status}`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-meta">
                  <div className="meta-item">
                    <Calendar size={16} />
                    <span>
                      {format(new Date(task.start_date), 'MMM d')} - {format(new Date(task.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>{getDaysRemaining(task.end_date)} days remaining</span>
                  </div>
                </div>

                <div className="task-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${calculateProgress(task)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {calculateProgress(task)}% complete 
                    ({task.checklistItems.filter(item => item.is_completed).length}/{task.checklistItems.length} items)
                  </span>
                </div>

                {task.schedules.length > 0 && (
                  <div className="task-schedules">
                    <strong>Reminders:</strong>
                    {task.schedules.map((schedule, index) => (
                      <span key={schedule.id} className="schedule-time">
                        {schedule.time}
                        {index < task.schedules.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}

                <div className="task-actions">
                  <Link to={`/tasks/${task.id}`} className="btn btn-secondary">
                    <Eye size={16} />
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;