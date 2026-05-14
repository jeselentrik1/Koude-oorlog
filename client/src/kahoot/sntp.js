export class SNTPClient {
  constructor(socket) {
    this.socket = socket;
    this.offsets = [];
    this.serverTimeOffset = 0;
    
    this.socket.on('sync:pong', ({ t1, t2, t3 }) => {
      const t4 = performance.now();
      
      // Calculate offset based on SNTP algorithm
      // offset = ((t2 - t1) + (t3 - t4)) / 2
      const offset = ((t2 - t1) + (t3 - t4)) / 2;
      
      this.offsets.push(offset);
      
      // Keep last 10 samples
      if (this.offsets.length > 10) {
        this.offsets.shift();
      }
      
      // Calculate median offset to ignore outliers
      const sorted = [...this.offsets].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      this.serverTimeOffset = sorted.length % 2 !== 0 
        ? sorted[mid] 
        : (sorted[mid - 1] + sorted[mid]) / 2;
    });
  }

  sync() {
    this.socket.emit('sync:ping', { t1: performance.now() });
  }

  startSync(intervalMs = 2000) {
    this.sync();
    this.syncInterval = setInterval(() => this.sync(), intervalMs);
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  now() {
    return performance.now() + this.serverTimeOffset;
  }
}
