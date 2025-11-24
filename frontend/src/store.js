import { create } from 'zustand';
import { api, setAuthToken } from './services/api';

// Initialize with a single default workflow; once a user logs in we replace
// this list with workflows loaded from MongoDB via the backend.
const initialWorkflows = [
  {
    id: 'wf_default_ab',
    name: 'A-B Transfer',
    description: 'Simple file transfer workflow from sender (A) to receiver (B)',
    nodes: [],
    connections: [],
    status: 'idle',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  authToken: null,
  authError: null,
  isAuthLoading: false,

  // Used when the app is loaded with ?authToken=... after Google OAuth
  setAuthFromToken: async (token) => {
    if (!token) return;
    setAuthToken(token);
    try {
      const data = await api.getCurrentUser();
      if (data?.user) {
        set({
          user: data.user,
          authToken: token,
        });
        await get().loadUserWorkflows();
      }
    } catch (error) {
      console.error('Failed to hydrate auth from token:', error);
      setAuthToken(null);
    }
  },

  signup: async (email, password) => {
    set({ isAuthLoading: true, authError: null });
    try {
      const data = await api.signup(email, password);
      if (data?.token) {
        setAuthToken(data.token);
      }
      set({
        user: data.user,
        authToken: data.token,
        isAuthLoading: false,
      });
      // Load any existing workflows for this user
      await get().loadUserWorkflows();
    } catch (error) {
      console.error('Signup failed:', error);
      const message = error?.response?.data?.error || 'Failed to sign up';
      set({ authError: message, isAuthLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isAuthLoading: true, authError: null });
    try {
      const data = await api.login(email, password);
      if (data?.token) {
        setAuthToken(data.token);
      }
      set({
        user: data.user,
        authToken: data.token,
        isAuthLoading: false,
      });
      await get().loadUserWorkflows();
    } catch (error) {
      console.error('Login failed:', error);
      const message = error?.response?.data?.error || 'Failed to log in';
      set({ authError: message, isAuthLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.logout().catch(() => {});
    } catch (e) {
      // ignore network/logout errors
    }
    setAuthToken(null);
    set({
      user: null,
      authToken: null,
      authError: null,
    });
  },

  loadUserWorkflows: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const data = await api.getWorkflows();
      if (Array.isArray(data?.workflows)) {
        set({ workflows: data.workflows });
      }
    } catch (error) {
      console.error('Failed to load workflows from server:', error);
    }
  },

  syncWorkflowsToServer: async () => {
    const { user, workflows } = get();
    if (!user) return;
    try {
      await api.saveWorkflows(workflows);
    } catch (error) {
      console.error('Failed to save workflows to server:', error);
    }
  },
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
    // Persist to server for logged-in user
    get().syncWorkflowsToServer();
    return newWorkflow.id;
  },

  deleteWorkflow: (id) => {
    set((state) => ({
      workflows: state.workflows.filter(w => w.id !== id),
      activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId,
      currentView: state.activeWorkflowId === id ? 'home' : state.currentView,
    }));
    // Persist change for logged-in user
    get().syncWorkflowsToServer();
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
    }
    // Persist latest workflows to server
    get().syncWorkflowsToServer();
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