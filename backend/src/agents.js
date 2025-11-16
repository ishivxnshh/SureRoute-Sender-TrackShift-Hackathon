// AI Agent System for SureRoute
// Three agents: Monitor, Scheduler, and Recovery

export class MonitorAgent {
  constructor(io) {
    this.io = io;
    this.name = 'Monitor';
    this.telemetryHistory = new Map();
    this.thresholds = {
      highRTT: 500, // ms
      highPacketLoss: 0.05, // 5%
      lowBandwidth: 100000, // 100 KB/s
    };
  }

  analyzeTelemetry(transferId, telemetry) {
    // Store telemetry history
    if (!this.telemetryHistory.has(transferId)) {
      this.telemetryHistory.set(transferId, []);
    }
    
    const history = this.telemetryHistory.get(transferId);
    history.push({ ...telemetry, timestamp: Date.now() });
    
    // Keep only last 30 data points
    if (history.length > 30) {
      history.shift();
    }

    // Analyze patterns
    const suggestions = [];

    // Check sustained high RTT
    const recentRTT = history.slice(-5).map(h => h.rtt);
    const avgRTT = recentRTT.reduce((a, b) => a + b, 0) / recentRTT.length;
    
    if (avgRTT > this.thresholds.highRTT) {
      suggestions.push({
        agent: this.name,
        transfer_id: transferId,
        action: 'reduce_chunk_size',
        reason: `High average RTT detected (${avgRTT.toFixed(0)}ms). Reducing chunk size can improve reliability.`,
      });
    }

    // Check packet loss
    if (telemetry.packetLoss > this.thresholds.highPacketLoss) {
      suggestions.push({
        agent: this.name,
        transfer_id: transferId,
        action: 'decrease_concurrency',
        reason: `High packet loss (${(telemetry.packetLoss * 100).toFixed(1)}%). Reducing concurrent transfers may help.`,
      });
    }

    // Check bandwidth degradation
    if (telemetry.bandwidth < this.thresholds.lowBandwidth) {
      suggestions.push({
        agent: this.name,
        transfer_id: transferId,
        action: 'use_relay',
        reason: `Low bandwidth detected (${(telemetry.bandwidth / 1024).toFixed(0)} KB/s). Consider using relay server.`,
      });
    }

    // Emit suggestions
    suggestions.forEach(suggestion => {
      this.io.emit('agent:suggest', suggestion);
    });

    return suggestions;
  }

  detectAnomaly(transferId, telemetry) {
    const history = this.telemetryHistory.get(transferId) || [];
    if (history.length < 10) return null;

    // Simple anomaly detection: compare with moving average
    const recent = history.slice(-10);
    const avgRTT = recent.reduce((sum, h) => sum + h.rtt, 0) / recent.length;
    
    if (telemetry.rtt > avgRTT * 2) {
      return {
        type: 'rtt_spike',
        severity: 'high',
        message: `RTT spike detected: ${telemetry.rtt}ms (avg: ${avgRTT.toFixed(0)}ms)`,
      };
    }

    return null;
  }
}

export class SchedulerAgent {
  constructor(io) {
    this.io = io;
    this.name = 'Scheduler';
    this.priorityQueue = new Map(); // priority -> [transferIds]
  }

  addTransfer(transfer) {
    const priority = transfer.priority || 'normal';
    
    if (!this.priorityQueue.has(priority)) {
      this.priorityQueue.set(priority, []);
    }
    
    this.priorityQueue.get(priority).push(transfer.id);
  }

  removeTransfer(transferId) {
    for (const [priority, transfers] of this.priorityQueue.entries()) {
      const index = transfers.indexOf(transferId);
      if (index > -1) {
        transfers.splice(index, 1);
      }
    }
  }

  optimizeConcurrency(transfers, telemetry) {
    const suggestions = [];

    transfers.forEach((transfer, id) => {
      const tel = telemetry.get(id);
      if (!tel) return;

      // If network is good and priority is high, suggest increasing concurrency
      if (
        transfer.priority === 'high' &&
        tel.rtt < 200 &&
        tel.packetLoss < 0.01 &&
        transfer.concurrency < 8
      ) {
        suggestions.push({
          agent: this.name,
          transfer_id: id,
          action: 'increase_concurrency',
          reason: `Network conditions are excellent. Increasing concurrency to ${transfer.concurrency + 2} for faster transfer.`,
        });
      }

      // If multiple high priority transfers, suggest pausing low priority
      const highPriorityCount = Array.from(transfers.values())
        .filter(t => t.priority === 'high' && t.status === 'active').length;
      
      if (
        highPriorityCount > 2 &&
        transfer.priority === 'low' &&
        transfer.status === 'active'
      ) {
        suggestions.push({
          agent: this.name,
          transfer_id: id,
          action: 'pause_low_priority',
          reason: `Multiple high-priority transfers active. Temporarily pausing low-priority transfer to allocate resources.`,
        });
      }
    });

    // Emit suggestions
    suggestions.forEach(suggestion => {
      this.io.emit('agent:suggest', suggestion);
    });

    return suggestions;
  }

  getNextTransfer() {
    // Priority order: high -> normal -> low
    const priorities = ['high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queue = this.priorityQueue.get(priority);
      if (queue && queue.length > 0) {
        return queue[0];
      }
    }
    
    return null;
  }
}

export class RecoveryAgent {
  constructor(io) {
    this.io = io;
    this.name = 'Recovery';
    this.failureHistory = new Map();
  }

  recordFailure(transferId, chunkIndex, reason) {
    if (!this.failureHistory.has(transferId)) {
      this.failureHistory.set(transferId, new Map());
    }
    
    const transferFailures = this.failureHistory.get(transferId);
    
    if (!transferFailures.has(chunkIndex)) {
      transferFailures.set(chunkIndex, []);
    }
    
    transferFailures.get(chunkIndex).push({
      timestamp: Date.now(),
      reason,
    });
  }

  analyzeFailures(transferId) {
    const failures = this.failureHistory.get(transferId);
    if (!failures) return [];

    const suggestions = [];
    let totalFailures = 0;
    let repeatedFailures = 0;

    for (const [chunkIndex, chunkFailures] of failures.entries()) {
      totalFailures += chunkFailures.length;
      
      // If a chunk failed more than 3 times, it's a repeated failure
      if (chunkFailures.length > 3) {
        repeatedFailures++;
      }
    }

    // If too many failures, suggest using relay
    if (totalFailures > 10) {
      suggestions.push({
        agent: this.name,
        transfer_id: transferId,
        action: 'use_relay',
        reason: `${totalFailures} chunk failures detected. Switching to relay server for better reliability.`,
      });
    }

    // If specific chunks keep failing, suggest transport switch
    if (repeatedFailures > 3) {
      suggestions.push({
        agent: this.name,
        transfer_id: transferId,
        action: 'switch_transport',
        reason: `${repeatedFailures} chunks with repeated failures. Current transport may be unstable - switching to fallback.`,
      });
    }

    // Emit suggestions
    suggestions.forEach(suggestion => {
      this.io.emit('agent:suggest', suggestion);
    });

    return suggestions;
  }

  shouldRetry(transferId, chunkIndex) {
    const failures = this.failureHistory.get(transferId);
    if (!failures) return true;

    const chunkFailures = failures.get(chunkIndex);
    if (!chunkFailures) return true;

    // Max 5 retries per chunk
    return chunkFailures.length < 5;
  }

  generateReport(transferId) {
    const failures = this.failureHistory.get(transferId);
    if (!failures) {
      return {
        totalFailures: 0,
        affectedChunks: 0,
        retryRate: 0,
      };
    }

    let totalFailures = 0;
    const affectedChunks = failures.size;

    for (const chunkFailures of failures.values()) {
      totalFailures += chunkFailures.length;
    }

    return {
      totalFailures,
      affectedChunks,
      retryRate: affectedChunks > 0 ? (totalFailures / affectedChunks).toFixed(2) : 0,
    };
  }
}

// Agent coordinator
export class AgentCoordinator {
  constructor(io) {
    this.io = io;
    this.monitorAgent = new MonitorAgent(io);
    this.schedulerAgent = new SchedulerAgent(io);
    this.recoveryAgent = new RecoveryAgent(io);
  }

  processTransfer(transfer, telemetry) {
    // Monitor agent analyzes telemetry
    const monitorSuggestions = this.monitorAgent.analyzeTelemetry(transfer.id, telemetry);
    
    // Scheduler agent adds transfer to queue
    this.schedulerAgent.addTransfer(transfer);
    
    return { monitorSuggestions };
  }

  processTelemetryUpdate(transferId, telemetry) {
    return this.monitorAgent.analyzeTelemetry(transferId, telemetry);
  }

  processChunkFailure(transferId, chunkIndex, reason) {
    this.recoveryAgent.recordFailure(transferId, chunkIndex, reason);
    return this.recoveryAgent.analyzeFailures(transferId);
  }

  optimizeScheduling(transfers, telemetry) {
    return this.schedulerAgent.optimizeConcurrency(transfers, telemetry);
  }
}
