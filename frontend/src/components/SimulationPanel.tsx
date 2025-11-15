import React from 'react';

const events = [
  { time: '0.253', last: 'Hub 1', device: 'PC Pixelz 1', type: 'ICMP' },
  { time: '0.254', last: 'Hub 1', device: 'PC Pixelz 2', type: 'ICMP' },
  { time: '0.255', last: 'Hub 1', device: 'PC Pixelz 2', type: 'ICMP' },
  { time: '0.256', last: 'Hub 1', device: 'PC Pixelz 1', type: 'ICMP' }
];

const filters = ['ARP', 'BGP', 'DHCP', 'DNS', 'EIGRP', 'HSRP', 'ICMP', 'OSPF', 'RIP'];

export default function SimulationPanel() {
  return (
    <section className="simulation-panel">
      <div className="panel-header">
        <div>
          <div className="text-sm text-gray-400">Simulation Panel</div>
          <div className="text-xs text-gray-500">Play Controls</div>
        </div>
        <button className="mini-btn">⤢</button>
      </div>
      <div className="controls">
        <button aria-label="back">⏮️</button>
        <button aria-label="pause">⏯️</button>
        <button aria-label="forward">⏭️</button>
      </div>
      <div className="panel-subtitle">
        Event List <button className="link">Reset Simulation</button>
      </div>
      <div className="event-list">
        {events.map((evt, idx) => (
          <div key={idx} className="event-row">
            <div className="event-vis">👁️</div>
            <div className="event-entry">
              <div className="event-time">{evt.time}s</div>
              <div className="event-details">
                <span>{evt.last}</span>
                <span>{evt.device}</span>
                <span className="event-pill">{evt.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="panel-subtitle flex items-center justify-between">
        <span>Event List Filter</span>
        <button className="link">Show More</button>
      </div>
      <div className="filter-grid">
        {filters.map((f) => (
          <label key={f} className="filter-item">
            <input type="checkbox" defaultChecked={f === 'ICMP'} />
            <span>{f}</span>
          </label>
        ))}
      </div>
    </section>
  );
}


