import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useStore } from './store';
import websocket from './services/websocket';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import WorkflowCanvas from './components/WorkflowCanvas';
import TopBar from './components/TopBar';
import BottomPanel from './components/BottomPanel';
import './App.css';

function App() {
  const { 
    currentView,
    theme,
    setConnectionStatus, 
    updateTransfer, 
    addTransfer,
    addAISuggestion, 
    updateTelemetry,
    addActiveTransport,
    removeActiveTransport,
  } = useStore();

  // Initialize theme
  useEffect(() => {
    console.log('Initializing theme:', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    console.log('Setting up WebSocket connection...');
    // Connect to WebSocket
    websocket.connect();

    // Setup event listeners
    websocket.on('connection:status', (status) => {
      setConnectionStatus(status);
    });

    websocket.on('transfer-started', (data) => {
      const id = data.transferId || data.id;
      const priority = data.priority || 'auto';
      const status = data.status === 'transferring' ? 'active' : (data.status || 'ready');

      addTransfer({
        id,
        fileName: data.fileName,
        fileSize: data.fileSize || 0,
        priority,
        status,
        progress: 0,
        speed: 0,
        eta: null,
        chunks: data.chunks || [],
        chunkStatus: {},
      });
    });

    websocket.on('transfer:update', (data) => {
      updateTransfer(data.transfer_id, {
        progress: data.progress,
        speed: data.speed_bytes_s,
        eta: data.eta,
        status: data.status,
        ...(data.priority ? { priority: data.priority } : {}),
      });
    });

    websocket.on('telemetry', (data) => {
      updateTelemetry(data.transfer_id, {
        rtt: data.rtt_ms,
        packetLoss: data.packet_loss,
        bandwidth: data.bandwidth,
        timestamp: Date.now(),
      });
    });

    websocket.on('agent:suggest', (data) => {
      addAISuggestion({
        agent: data.agent,
        transferId: data.transfer_id,
        action: data.action,
        reason: data.reason,
        timestamp: Date.now(),
      });
    });

    websocket.on('chunk:update', (data) => {
      updateTransfer(data.transfer_id, {
        chunkStatus: data.chunk_status,
      });
    });

    websocket.on('transport:change', (data) => {
      if (data.added) {
        addActiveTransport(data.transport);
      } else {
        removeActiveTransport(data.transport);
      }
    });

    return () => {
      websocket.disconnect();
    };
  }, []);

  // Render different views based on currentView
  console.log('Current View:', currentView);
  console.log('Theme:', theme);

  if (currentView === 'landing') {
    return <LandingPage />;
  }

  console.log('Rendering Workflow Editor');
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <TopBar />
        <WorkflowCanvas />
        <BottomPanel />
      </div>
    </DndProvider>
  );
}export default App;
