export interface User {
  id: number;
  username: string;
  email: string;
  phoneNumber?: string;
  timezone: string;
  createdAt?: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'paused' | 'failed';
  created_at: string;
  updated_at: string;
  checklistItems: ChecklistItem[];
  schedules: DailySchedule[];
}

export interface ChecklistItem {
  id: number;
  task_id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DailySchedule {
  id: number;
  task_id: number;
  time: string;
  days_of_week: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskProgress {
  taskId: number;
  totalDays: number;
  daysPassed: number;
  daysRemaining: number;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  dailyProgress: DailyProgressItem[];
}

export interface DailyProgressItem {
  date: string;
  total: number;
  completed: number;
}

export interface NotificationService {
  sms: {
    available: boolean;
    provider: string;
  };
  push: {
    available: boolean;
    provider: string;
  };
  configured: boolean;
}