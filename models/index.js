class Task {
  constructor(id, title, description, dueDate, completed = false, priority = 'medium') {
    this.id = id;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.completed = completed;
    this.priority = priority;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  markCompleted() {
    this.completed = true;
    this.updatedAt = new Date();
  }

  updateTask(updates) {
    Object.assign(this, updates);
    this.updatedAt = new Date();
  }
}

class DisciplineGoal {
  constructor(id, title, description, targetDate, progress = 0) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.targetDate = targetDate;
    this.progress = progress;
    this.tasks = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  addTask(task) {
    this.tasks.push(task);
    this.updatedAt = new Date();
  }

  updateProgress() {
    if (this.tasks.length === 0) {
      this.progress = 0;
      return;
    }
    
    const completedTasks = this.tasks.filter(task => task.completed).length;
    this.progress = Math.round((completedTasks / this.tasks.length) * 100);
    this.updatedAt = new Date();
  }
}

module.exports = {
  Task,
  DisciplineGoal
};