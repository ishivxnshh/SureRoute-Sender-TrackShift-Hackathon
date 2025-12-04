import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('sureroute_auth_token', token);
  } else {
    delete axios.defaults.headers.common.Authorization;
    localStorage.removeItem('sureroute_auth_token');
  }
};

export const api = {
  // Auth operations
  async signup(email, password) {
    const response = await axios.post(`${API_BASE}/auth/signup`, { email, password });
    return response.data;
  },

  async login(email, password) {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return response.data;
  },

  async getCurrentUser() {
    const response = await axios.get(`${API_BASE}/auth/me`);
    return response.data;
  },

  async logout() {
    const response = await axios.post(`${API_BASE}/auth/logout`);
    return response.data;
  },

  async getWorkflows() {
    const response = await axios.get(`${API_BASE}/workflows`);
    return response.data;
  },

  async saveWorkflows(workflows) {
    const response = await axios.post(`${API_BASE}/workflows`, { workflows });
    return response.data;
  },

  // Transfer operations
  async createTransfer(manifest) {
    const response = await axios.post(`${API_BASE}/transfer/create`, manifest);
    return response.data;
  },

  async checkManifest(manifest) {
    const response = await axios.post(`${API_BASE}/manifest/check`, manifest);
    return response.data;
  },

  async uploadChunk(transferId, chunkIndex, file, onProgress) {
    const formData = new FormData();
    formData.append('chunk', file);
    
    const response = await axios.post(
      `${API_BASE}/upload/${transferId}/${chunkIndex}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      }
    );
    return response.data;
  },

  async pauseTransfer(transferId) {
    const response = await axios.post(`${API_BASE}/transfer/${transferId}/pause`);
    return response.data;
  },

  async resumeTransfer(transferId) {
    const response = await axios.post(`${API_BASE}/transfer/${transferId}/resume`);
    return response.data;
  },

  async cancelTransfer(transferId) {
    const response = await axios.post(`${API_BASE}/transfer/${transferId}/cancel`);
    return response.data;
  },

  async cancelAllTransfers() {
    const response = await axios.post(`${API_BASE}/transfer/cancel-all`);
    return response.data;
  },

  async changePriority(transferId, priority) {
    const response = await axios.post(`${API_BASE}/transfer/${transferId}/priority`, { priority });
    return response.data;
  },

  // AI Agent operations
  async acceptSuggestion(suggestionId) {
    const response = await axios.post(`${API_BASE}/agent/accept/${suggestionId}`);
    return response.data;
  },

  async rejectSuggestion(suggestionId) {
    const response = await axios.post(`${API_BASE}/agent/reject/${suggestionId}`);
    return response.data;
  },

  async setAutomationLevel(level) {
    const response = await axios.post(`${API_BASE}/agent/automation`, { level });
    return response.data;
  },

  // Transport operations
  async setTransport(transportType, settings) {
    const response = await axios.post(`${API_BASE}/transport/set`, { type: transportType, settings });
    return response.data;
  },

  async getAvailableTransports() {
    const response = await axios.get(`${API_BASE}/transport/available`);
    return response.data;
  },

  // Simulator operations
  async updateSimulator(settings) {
    const response = await axios.post(`${API_BASE}/simulator/update`, settings);
    return response.data;
  },

  async triggerNetworkEvent(event) {
    const response = await axios.post(`${API_BASE}/simulator/event`, { event });
    return response.data;
  },

  // Peer operations (for real device demo)
  async discoverPeers() {
    const response = await axios.get(`${API_BASE}/peer/discover`);
    return response.data;
  },

  async connectToPeer(peerId) {
    const response = await axios.post(`${API_BASE}/peer/connect`, { peerId });
    return response.data;
  },

  // Ask AI
  async askAI(question, context) {
    const response = await axios.post(`${API_BASE}/ai/ask`, { question, context });
    return response.data;
  },
};
