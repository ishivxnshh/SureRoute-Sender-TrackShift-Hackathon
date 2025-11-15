import React from 'react';
import { useStore } from '../store/useStore';

export default function ActivityLog() {
  const activity = useStore((s) => s.activity);
  return (
    <div className="activity-log">
      {activity.map((a, i) => (
        <div key={i} className="activity-log__entry">
          {a}
        </div>
      ))}
      {activity.length === 0 && <div className="activity-log__entry activity-log__entry--muted">No activity yet.</div>}
    </div>
  );
}


