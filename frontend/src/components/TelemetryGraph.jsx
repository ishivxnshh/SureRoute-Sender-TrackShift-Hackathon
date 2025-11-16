import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './TelemetryGraph.css';

const TelemetryGraph = ({ transferId }) => {
  const { telemetry } = useStore();
  const [dataPoints, setDataPoints] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('all');

  useEffect(() => {
    const transferTelemetry = telemetry[transferId];
    if (transferTelemetry) {
      setDataPoints(prev => {
        const newPoint = {
          time: new Date(transferTelemetry.timestamp).toLocaleTimeString(),
          rtt: transferTelemetry.rtt,
          packetLoss: transferTelemetry.packetLoss * 100,
          bandwidth: transferTelemetry.bandwidth / 1024, // Convert to KB/s
        };
        
        // Keep only last 20 data points
        const updated = [...prev, newPoint].slice(-20);
        return updated;
      });
    }
  }, [telemetry, transferId]);

  // Generate sample data if no real data yet
  useEffect(() => {
    if (dataPoints.length === 0) {
      const sampleData = Array.from({ length: 15 }, (_, i) => ({
        time: new Date(Date.now() - (14 - i) * 2000).toLocaleTimeString(),
        rtt: 150 + Math.random() * 100,
        packetLoss: Math.random() * 5,
        bandwidth: 800 + Math.random() * 400,
      }));
      setDataPoints(sampleData);
    }
  }, []);

  const currentTelemetry = telemetry[transferId] || {
    rtt: dataPoints[dataPoints.length - 1]?.rtt || 0,
    packetLoss: dataPoints[dataPoints.length - 1]?.packetLoss / 100 || 0,
    bandwidth: dataPoints[dataPoints.length - 1]?.bandwidth * 1024 || 0,
  };

  const getRTTStatus = (rtt) => {
    if (rtt < 100) return 'excellent';
    if (rtt < 300) return 'good';
    if (rtt < 500) return 'fair';
    return 'poor';
  };

  const getPacketLossStatus = (loss) => {
    if (loss < 0.01) return 'excellent';
    if (loss < 0.03) return 'good';
    if (loss < 0.05) return 'fair';
    return 'poor';
  };

  return (
    <div className="telemetry-container">
      <div className="telemetry-summary">
        <div className="telemetry-card">
          <div className="card-label">Round Trip Time</div>
          <div className="card-value">{currentTelemetry.rtt?.toFixed(0)} ms</div>
          <div className={`card-status status-${getRTTStatus(currentTelemetry.rtt)}`}>
            {getRTTStatus(currentTelemetry.rtt).toUpperCase()}
          </div>
        </div>

        <div className="telemetry-card">
          <div className="card-label">Packet Loss</div>
          <div className="card-value">{(currentTelemetry.packetLoss * 100).toFixed(2)}%</div>
          <div className={`card-status status-${getPacketLossStatus(currentTelemetry.packetLoss)}`}>
            {getPacketLossStatus(currentTelemetry.packetLoss).toUpperCase()}
          </div>
        </div>

        <div className="telemetry-card">
          <div className="card-label">Bandwidth</div>
          <div className="card-value">{(currentTelemetry.bandwidth / 1024).toFixed(0)} KB/s</div>
          <div className="card-status status-good">STABLE</div>
        </div>
      </div>

      <div className="metric-selector">
        <button
          className={`metric-btn ${selectedMetric === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('all')}
        >
          All Metrics
        </button>
        <button
          className={`metric-btn ${selectedMetric === 'rtt' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('rtt')}
        >
          RTT Only
        </button>
        <button
          className={`metric-btn ${selectedMetric === 'loss' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('loss')}
        >
          Packet Loss
        </button>
      </div>

      <div className="telemetry-graph">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dataPoints}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3655" />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              style={{ fontSize: '11px' }}
            />
            <YAxis 
              stroke="#64748b" 
              style={{ fontSize: '11px' }}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1f3a',
                border: '1px solid #2d3655',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            {(selectedMetric === 'all' || selectedMetric === 'rtt') && (
              <Line 
                type="monotone" 
                dataKey="rtt" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                name="RTT (ms)"
              />
            )}
            {(selectedMetric === 'all' || selectedMetric === 'loss') && (
              <Line 
                type="monotone" 
                dataKey="packetLoss" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={false}
                name="Packet Loss (%)"
              />
            )}
            {selectedMetric === 'all' && (
              <Line 
                type="monotone" 
                dataKey="bandwidth" 
                stroke="#4ade80" 
                strokeWidth={2}
                dot={false}
                name="Bandwidth (KB/s)"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TelemetryGraph;
