import { create } from 'zustand';

// Load workflows from localStorage
const loadWorkflowsFromStorage = () => {
  try {
    const savedWorkflows = localStorage.getItem('sureroute_workflows');
    if (savedWorkflows) {
      const parsed = JSON.parse(savedWorkflows);
      // Drop any legacy workflows named "ABS"
      const filtered = parsed.filter((wf) => wf.name !== 'ABS');
      if (filtered.length !== parsed.length) {
        localStorage.setItem('sureroute_workflows', JSON.stringify(filtered));
      }
      // Convert saved workflows to store format
      return filtered.map((wf, index) => ({
        id: `wf_saved_${Date.now()}_${index}`,
        name: wf.name || `Workflow ${index + 1}`,
        description: wf.description || 'Saved workflow',
        nodes: wf.nodes || [],
        connections: wf.connections || [],
        status: 'idle',
        createdAt: new Date(wf.savedAt).getTime() || Date.now(),
        updatedAt: new Date(wf.savedAt).getTime() || Date.now(),
      }));
    }
  } catch (error) {
    console.error('Failed to load workflows from localStorage:', error);
  }
  return [];
};

// Initialize with demo workflows + saved workflows
const initialWorkflows = [
  {
    id: 'wf_demo_1',
    name: 'File Transfer Workflow',
    description: 'High-priority file transfer with AI optimization',
    nodes: [],
    connections: [],
    status: 'idle',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'wf_demo_2',
    name: 'Multi-Device Sync',
    description: 'Sync files across multiple devices using P2P',
    nodes: [],
    connections: [],
    status: 'idle',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 7200000,
  },
  ...loadWorkflowsFromStorage()
];

export const useStore = create((set, get) => ({
  // Theme
  theme: 'dark',
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
  },

  // View mode
  currentView: 'home', // 'home' or 'workflow'
  setCurrentView: (view) => set({ currentView: view }),

  // Workflows (Projects)
  workflows: initialWorkflows,
  activeWorkflowId: null,
  
  createWorkflow: (name, description) => {
    const newWorkflow = {
      id: `wf_${Date.now()}`,
      name,
      description,
      nodes: [],
      connections: [],
      status: 'idle',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({
      workflows: [...state.workflows, newWorkflow],
      activeWorkflowId: newWorkflow.id,
      currentView: 'workflow',
    }));
    get().loadWorkflowToCanvas(newWorkflow.id);
    return newWorkflow.id;
  },

  deleteWorkflow: (id) => {
    set((state) => ({
      workflows: state.workflows.filter(w => w.id !== id),
      activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId,
      currentView: state.activeWorkflowId === id ? 'home' : state.currentView,
    }));

    // Also remove from localStorage
    try {
      const savedWorkflows = JSON.parse(localStorage.getItem('sureroute_workflows') || '[]');
      const updatedWorkflows = savedWorkflows.filter((w) => w.id !== id && w.name !== id);
      localStorage.setItem('sureroute_workflows', JSON.stringify(updatedWorkflows));
    } catch (error) {
      console.error('Failed to delete workflow from localStorage:', error);
    }
  },

  setActiveWorkflow: (id) => {
    set({ activeWorkflowId: id, currentView: 'workflow' });
    get().loadWorkflowToCanvas(id);
  },

  updateWorkflow: (id, updates) => set((state) => ({
    workflows: state.workflows.map(w => 
      w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
    ),
  })),

  saveWorkflowState: () => {
    const {
      activeWorkflowId,
      canvasNodes,
      canvasConnections,
      canvasPosition,
      canvasZoom,
      workflows,
    } = get();
    if (activeWorkflowId) {
      // Update in Zustand store
      get().updateWorkflow(activeWorkflowId, {
        nodes: canvasNodes,
        connections: canvasConnections,
        canvasPosition,
        canvasZoom,
      });

      // Also update in localStorage so layout persists
      try {
        const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);
        const savedWorkflows = JSON.parse(localStorage.getItem('sureroute_workflows') || '[]');
        const updatedWorkflows = savedWorkflows.map(w => {
          if (
            (activeWorkflow && w.name === activeWorkflow.name) ||
            JSON.stringify(w.nodes) === JSON.stringify(canvasNodes)
          ) {
            return {
              ...w,
              nodes: canvasNodes,
              connections: canvasConnections,
              canvasPosition,
              canvasZoom,
              savedAt: new Date().toISOString(),
            };
          }
          return w;
        });
        localStorage.setItem('sureroute_workflows', JSON.stringify(updatedWorkflows));
      } catch (error) {
        console.error('Failed to sync layout to localStorage:', error);
      }
    }
  },

  loadWorkflowToCanvas: (workflowId) => {
    const workflow = get().workflows.find(w => w.id === workflowId);
    if (workflow) {
      set({
        canvasNodes: workflow.nodes || [],
        canvasConnections: workflow.connections || [],
        activeWorkflowId: workflowId,
        selectedNodeId: null,
        canvasPosition: workflow.canvasPosition || { x: 0, y: 0 },
        canvasZoom: workflow.canvasZoom || 1,
      });
    }
  },

  // Canvas/Workflow Editor
  canvasNodes: [],
  canvasConnections: [],
  selectedNodeId: null,
  canvasPosition: { x: 0, y: 0 },
  canvasZoom: 1,
  connectingFrom: null, // For drawing connections

  addCanvasNode: (node) => {
    const newNode = {
      id: `node_${Date.now()}`,
      ...node,
      position: node.position || { x: 100, y: 100 },
      config: node.config || {},
    };
    set((state) => ({
      canvasNodes: [...state.canvasNodes, newNode],
    }));
    get().saveWorkflowState();
  },

  updateCanvasNode: (id, updates) => {
    set((state) => ({
      canvasNodes: state.canvasNodes.map(n => 
        n.id === id ? { ...n, ...updates } : n
      ),
    }));
    get().saveWorkflowState();
  },

  deleteCanvasNode: (id) => {
    const { activeWorkflowId } = get();

    set((state) => {
      const newCanvasNodes = state.canvasNodes.filter((n) => n.id !== id);
      const newCanvasConnections = state.canvasConnections.filter(
        (c) => c.sourceId !== id && c.targetId !== id
      );

      // If this was the last node in the active workflow, delete the workflow too
      let newWorkflows = state.workflows;
      let newActiveWorkflowId = state.activeWorkflowId;
      let newCurrentView = state.currentView;

      if (activeWorkflowId && newCanvasNodes.length === 0) {
        newWorkflows = state.workflows.filter((w) => w.id !== activeWorkflowId);
        if (state.activeWorkflowId === activeWorkflowId) {
          newActiveWorkflowId = null;
          newCurrentView = 'home';
        }

        // Also remove from localStorage
        try {
          const savedWorkflows = JSON.parse(localStorage.getItem('sureroute_workflows') || '[]');
          const updatedWorkflows = savedWorkflows.filter(
            (w) => w.id !== activeWorkflowId && w.name !== activeWorkflowId
          );
          localStorage.setItem('sureroute_workflows', JSON.stringify(updatedWorkflows));
        } catch (error) {
          console.error('Failed to delete workflow from localStorage after last node removed:', error);
        }
      }

      return {
        canvasNodes: newCanvasNodes,
        canvasConnections: newCanvasConnections,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        workflows: newWorkflows,
        activeWorkflowId: newActiveWorkflowId,
        currentView: newCurrentView,
      };
    });

    get().saveWorkflowState();
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  startConnection: (nodeId) => set({ connectingFrom: nodeId }),
  cancelConnection: () => set({ connectingFrom: null }),

  addConnection: (connection) => {
    set((state) => ({
      canvasConnections: [...state.canvasConnections, {
        id: `conn_${Date.now()}`,
        ...connection,
      }],
      connectingFrom: null,
    }));
    get().saveWorkflowState();
  },

  deleteConnection: (id) => {
    set((state) => ({
      canvasConnections: state.canvasConnections.filter(c => c.id !== id),
    }));
    get().saveWorkflowState();
  },

  setCanvasPosition: (position) => set({ canvasPosition: position }),
  setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),

  clearCanvas: () => set({
    canvasNodes: [],
    canvasConnections: [],
    selectedNodeId: null,
  }),

  // Connection state
  connectionStatus: 'disconnected', // 'connected', 'disconnected', 'degraded'
  activeTransports: [],
  environment: 'demo', // 'demo' or 'real'
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setEnvironment: (env) => set({ environment: env }),
  addActiveTransport: (transport) => set((state) => ({
    activeTransports: [...state.activeTransports, transport]
  })),
  removeActiveTransport: (transport) => set((state) => ({
    activeTransports: state.activeTransports.filter(t => t !== transport)
  })),
  
  // Legacy compatibility
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),

  // Transfers
  transfers: [],
  activeTransfer: null,

  addTransfer: (transfer) => set((state) => ({
    transfers: [...state.transfers, transfer],
  })),

  updateTransfer: (id, updates) => set((state) => ({
    transfers: state.transfers.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ),
  })),

  setActiveTransfer: (transfer) => set({ activeTransfer: transfer }),

  // AI Suggestions
  aiSuggestions: [],
  automationLevel: 'manual',

  addAISuggestion: (suggestion) => set((state) => ({
    aiSuggestions: [...state.aiSuggestions, suggestion],
  })),

  removeAISuggestion: (id) => set((state) => ({
    aiSuggestions: state.aiSuggestions.filter(s => s.id !== id),
  })),

  setAutomationLevel: (level) => set({ automationLevel: level }),

  // Telemetry
  telemetry: {},
  updateTelemetry: (transferId, data) => set((state) => ({
    telemetry: {
      ...state.telemetry,
      [transferId]: data,
    },
  })),

  // Simulator
  simulatorSettings: {
    latency: 0,
    packetLoss: 0,
    bandwidth: 1000000,
  },

  updateSimulatorSettings: (settings) => set((state) => ({
    simulatorSettings: { ...state.simulatorSettings, ...settings },
  })),

  // Execution state
  isExecuting: false,
  executionProgress: {},
  executionResults: {},
  
  startExecution: () => set({ isExecuting: true, executionProgress: {}, executionResults: {} }),
  stopExecution: () => set({ isExecuting: false }),
  
  updateExecutionProgress: (nodeId, status) => set((state) => ({
    executionProgress: {
      ...state.executionProgress,
      [nodeId]: status, // 'running', 'success', 'error'
    },
  })),

  updateExecutionResult: (nodeId, result) => set((state) => ({
    executionResults: {
      ...state.executionResults,
      [nodeId]: result,
    },
  })),
}));
