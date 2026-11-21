const API_BASE = '/api/v1';

class ApiClient {
  private getHeaders(isMultipart = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('documind_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, isMultipart = false): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = this.getHeaders(isMultipart);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    });

    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      // Auto-logout or token expired
      localStorage.removeItem('documind_access_token');
      localStorage.removeItem('documind_refresh_token');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Network request failed' }));
      const msg = errorData.detail || errorData.message || JSON.stringify(errorData);
      throw new Error(msg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(credentials: any) {
    return this.request<{ user: any; tokens: { access: string; refresh: string } }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(data: any) {
    return this.request<{ user: any; tokens: { access: string; refresh: string } }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me/');
  }

  async updateProfile(profileData: any) {
    return this.request<any>('/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  }

  async updateSettings(settingsData: any) {
    return this.request<any>('/auth/settings/', {
      method: 'PATCH',
      body: JSON.stringify(settingsData)
    });
  }

  // Workspaces
  async getWorkspaces() {
    return this.request<{ results: any[] }>('/workspaces/');
  }

  async createWorkspace(data: { name: string; description?: string }) {
    return this.request<any>('/workspaces/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getWorkspace(id: string) {
    return this.request<any>(`/workspaces/${id}/`);
  }

  async deleteWorkspace(id: string) {
    return this.request<any>(`/workspaces/${id}/`, { method: 'DELETE' });
  }

  // Documents
  async getDocuments(params?: { workspace_id?: string; search?: string; status?: string }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<{ results: any[] }>(`/documents/${q ? `?${q}` : ''}`);
  }

  async uploadDocument(formData: FormData) {
    return this.request<any>('/documents/', {
      method: 'POST',
      body: formData
    }, true);
  }

  async getDocument(id: string) {
    return this.request<any>(`/documents/${id}/`);
  }

  async deleteDocument(id: string) {
    return this.request<any>(`/documents/${id}/`, { method: 'DELETE' });
  }

  // RAG & Grounded Chat
  async queryRAG(payload: { query: string; workspace_id: string; document_ids?: string[]; conversation_id?: string }) {
    return this.request<any>('/rag/query/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Conversations
  async getConversations(workspace_id?: string) {
    const q = workspace_id ? `?workspace_id=${workspace_id}` : '';
    return this.request<{ results: any[] }>(`/conversations/${q}`);
  }

  async createConversation(data: { workspace: string; title?: string; selected_document_ids?: string[] }) {
    return this.request<any>('/conversations/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getConversation(id: string) {
    return this.request<any>(`/conversations/${id}/`);
  }

  async deleteConversation(id: string) {
    return this.request<any>(`/conversations/${id}/`, { method: 'DELETE' });
  }

  // Agent Tasks
  async getAgentTasks(workspace_id?: string) {
    const q = workspace_id ? `?workspace_id=${workspace_id}` : '';
    return this.request<{ results: any[] }>(`/agent/tasks/${q}`);
  }

  async createAgentTask(data: { workspace_id: string; task_description: string; document_ids?: string[] }) {
    return this.request<any>('/agent/tasks/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAgentTask(id: string) {
    return this.request<any>(`/agent/tasks/${id}/`);
  }

  async cancelAgentTask(id: string) {
    return this.request<any>(`/agent/tasks/${id}/cancel/`, { method: 'POST' });
  }

  async approveAgentTask(id: string, reason?: string) {
    return this.request<any>(`/agent/tasks/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async rejectAgentTask(id: string, reason?: string) {
    return this.request<any>(`/agent/tasks/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async getAgentTools() {
    return this.request<{ tools: any[] }>('/agent/tools/');
  }

  // Summaries
  async getSummaries(document_id?: string) {
    const q = document_id ? `?document_id=${document_id}` : '';
    return this.request<{ results: any[] }>(`/summaries/${q}`);
  }

  async generateSummary(data: { document_id: string; summary_type: string }) {
    return this.request<any>('/summaries/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Comparisons
  async getComparisons(workspace_id?: string) {
    const q = workspace_id ? `?workspace_id=${workspace_id}` : '';
    return this.request<{ results: any[] }>(`/comparison/${q}`);
  }

  async createComparison(data: { workspace_id: string; document_ids: string[]; title?: string }) {
    return this.request<any>('/comparison/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Research
  async getResearchAnalyses(document_id?: string) {
    const q = document_id ? `?document_id=${document_id}` : '';
    return this.request<{ results: any[] }>(`/research/${q}`);
  }

  async analyzeResearchPaper(document_id: string) {
    return this.request<any>('/research/', {
      method: 'POST',
      body: JSON.stringify({ document_id })
    });
  }

  // Extraction
  async getExtractedTables(document_id: string) {
    return this.request<{ results: any[] }>(`/extraction/documents/${document_id}/tables/`);
  }

  async getExtractedEntities(document_id: string) {
    return this.request<{ results: any[] }>(`/extraction/documents/${document_id}/entities/`);
  }

  async runExtraction(document_id: string) {
    return this.request<any>(`/extraction/documents/${document_id}/run/`, { method: 'POST' });
  }

  // Quizzes & Flashcards
  async getQuizzes(document_id?: string) {
    const q = document_id ? `?document_id=${document_id}` : '';
    return this.request<{ results: any[] }>(`/quizzes/${q}`);
  }

  async generateQuiz(data: { document_id: string; difficulty?: string; question_count?: number }) {
    return this.request<any>('/quizzes/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getFlashcardDecks(document_id?: string) {
    const q = document_id ? `?document_id=${document_id}` : '';
    return this.request<{ results: any[] }>(`/flashcards/decks/${q}`);
  }

  async generateFlashcardDeck(data: { document_id: string; deck_title?: string }) {
    return this.request<any>('/flashcards/decks/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Analytics & Dashboard
  async getDashboardStats(workspace_id?: string) {
    const q = workspace_id ? `?workspace_id=${workspace_id}` : '';
    return this.request<any>(`/analytics/dashboard/${q}`);
  }

  async getAnalyticsMetrics() {
    return this.request<any>('/analytics/metrics/');
  }

  // Audit Logs
  async getAuditLogs() {
    return this.request<{ results: any[] }>('/audit/logs/');
  }
}

export const api = new ApiClient();
