class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    console.log('📈 Scheduler service started');
  }

  stop() {
    this.isRunning = false;
    console.log('📈 Scheduler service stopped');
  }

  getJobStatus() {
    return { scheduler: 'running' };
  }
}

module.exports = SchedulerService;