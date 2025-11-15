const PRIORITY = {
  high: 'high',
  medium: 'medium',
  low: 'low'
};

// Default max concurrency slots per priority
let limits = {
  [PRIORITY.high]: 6,
  [PRIORITY.medium]: 4,
  [PRIORITY.low]: 2
};

const usage = {
  [PRIORITY.high]: 0,
  [PRIORITY.medium]: 0,
  [PRIORITY.low]: 0
};

const waitQueues = {
  [PRIORITY.high]: [],
  [PRIORITY.medium]: [],
  [PRIORITY.low]: []
};

// Track whether high-priority transfer is active to reduce lower limits
let highActive = false;

export function setHighActive(active) {
  highActive = active;
  if (highActive) {
    limits = { high: 6, medium: 2, low: 1 };
  } else {
    limits = { high: 6, medium: 4, low: 2 };
  }
  drainAll();
}

function drainAll() {
  Object.keys(waitQueues).forEach((p) => {
    drainPriority(p);
  });
}

function drainPriority(priority) {
  const queue = waitQueues[priority];
  while (queue.length > 0 && usage[priority] < limits[priority]) {
    const next = queue.shift();
    usage[priority] += 1;
    next();
  }
}

export function acquireSlot(priority = PRIORITY.medium) {
  return new Promise((resolve) => {
    const proceed = () => {
      resolve(() => {
        // release
        usage[priority] = Math.max(0, usage[priority] - 1);
        drainPriority(priority);
      });
    };
    if (usage[priority] < limits[priority]) {
      usage[priority] += 1;
      resolve(() => {
        usage[priority] = Math.max(0, usage[priority] - 1);
        drainPriority(priority);
      });
    } else {
      waitQueues[priority].push(proceed);
    }
  });
}

export function getSchedulerState() {
  return {
    limits: { ...limits },
    usage: { ...usage },
    highActive
  };
}

export { PRIORITY };


