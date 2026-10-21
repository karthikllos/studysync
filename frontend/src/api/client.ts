const API_BASE_URL = 'http://localhost:8000/api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'TA' | 'ADMIN';
  institution: string;
  major_or_department: string;
  bio: string;
  avatar_url: string;
  study_streak_days: number;
  total_study_minutes: number;
  is_online?: boolean;
}

export interface StudyRoom {
  id: string;
  name: string;
  course_code: string;
  description: string;
  category: 'CS' | 'AI' | 'MATH' | 'ENG' | 'SCI' | 'GEN';
  is_private: boolean;
  passcode?: string;
  owner: User;
  banner_url: string;
  members_count: number;
  max_members: number;
  created_at: string;
  updated_at: string;
  is_joined: boolean;
  my_role?: 'LEADER' | 'MODERATOR' | 'MEMBER' | null;
}

export interface ChatMessage {
  id: string;
  room: string;
  sender: User;
  message_type: 'TEXT' | 'CODE' | 'FILE' | 'SYSTEM' | 'POLL';
  content: string;
  code_language?: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender: User;
  recipient: User;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface CollaborativeDocument {
  id: string;
  room: string;
  title: string;
  content: string;
  last_modified_by?: User;
  updated_at: string;
  created_at: string;
}

export interface TaskItem {
  id: string;
  room: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigned_to?: User;
  created_by: User;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SharedResource {
  id: string;
  room: string;
  title: string;
  description: string;
  resource_type: string;
  file_url: string;
  file_size_bytes: number;
  uploaded_by: User;
  download_count: number;
  created_at: string;
}

// Token helpers
export const getAccessToken = () => localStorage.getItem('studysync_access_token');
export const getRefreshToken = () => localStorage.getItem('studysync_refresh_token');
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('studysync_access_token', access);
  localStorage.setItem('studysync_refresh_token', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('studysync_access_token');
  localStorage.removeItem('studysync_refresh_token');
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Attempt token refresh if available
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('studysync_access_token', data.access);
          // Retry original request
          (headers as Record<string, string>)['Authorization'] = `Bearer ${data.access}`;
          const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          if (!retryRes.ok) {
            throw new Error(`API Error: ${retryRes.statusText}`);
          }
          return retryRes.json();
        }
      } catch (err) {
        clearTokens();
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<{ access: string; refresh: string; user: User }>('/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: any) =>
    apiRequest<{ access: string; refresh: string; user: User }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getProfile: () => apiRequest<User>('/auth/profile/'),
  getUsers: (search?: string) =>
    apiRequest<{ results: User[] } | User[]>(`/auth/users/${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  recordStudySession: (minutes: number) =>
    apiRequest<{ total_study_minutes: number; message: string }>('/auth/study-session/', {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    }),

  // Rooms
  getRooms: (category?: string, search?: string, myOnly?: boolean) => {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (search) params.append('search', search);
    if (myOnly) params.append('my_rooms', 'true');
    return apiRequest<{ results: StudyRoom[] } | StudyRoom[]>(`/collab/rooms/?${params.toString()}`);
  },

  getRoom: (id: string) => apiRequest<StudyRoom>(`/collab/rooms/${id}/`),
  createRoom: (data: any) =>
    apiRequest<StudyRoom>('/collab/rooms/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  joinRoom: (id: string, passcode?: string) =>
    apiRequest<{ message: string; role: string }>(`/collab/rooms/${id}/join/`, {
      method: 'POST',
      body: JSON.stringify({ passcode }),
    }),

  leaveRoom: (id: string) =>
    apiRequest<{ message: string }>(`/collab/rooms/${id}/leave/`, {
      method: 'POST',
    }),

  getRoomMembers: (id: string) => apiRequest<any[]>(`/collab/rooms/${id}/members/`),

  // Chat Messages
  getRoomMessages: (roomId: string) =>
    apiRequest<{ results: ChatMessage[] } | ChatMessage[]>(`/collab/messages/?room=${roomId}`),

  sendMessage: (data: { room: string; content: string; message_type?: string; code_language?: string; attachment_url?: string; attachment_name?: string }) =>
    apiRequest<ChatMessage>('/collab/messages/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Direct Messages
  getDirectMessages: (withUserId?: number) =>
    apiRequest<{ results: DirectMessage[] } | DirectMessage[]>(`/collab/direct-messages/${withUserId ? `?with_user=${withUserId}` : ''}`),

  sendDirectMessage: (recipient_id: number, content: string) =>
    apiRequest<DirectMessage>('/collab/direct-messages/', {
      method: 'POST',
      body: JSON.stringify({ recipient_id, content }),
    }),

  markDirectMessagesRead: (sender_id: number) =>
    apiRequest<{ message: string }>('/collab/direct-messages/mark_all_read/', {
      method: 'POST',
      body: JSON.stringify({ sender_id }),
    }),

  // Collaborative Documents
  getRoomDocuments: (roomId: string) =>
    apiRequest<{ results: CollaborativeDocument[] } | CollaborativeDocument[]>(`/collab/documents/?room=${roomId}`),

  updateDocument: (id: string, data: { title?: string; content?: string }) =>
    apiRequest<CollaborativeDocument>(`/collab/documents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  createDocument: (data: { room: string; title: string; content: string }) =>
    apiRequest<CollaborativeDocument>('/collab/documents/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tasks (Kanban)
  getRoomTasks: (roomId: string) =>
    apiRequest<{ results: TaskItem[] } | TaskItem[]>(`/collab/tasks/?room=${roomId}`),

  createTask: (data: { room: string; title: string; description?: string; status?: string; priority?: string; assigned_to_id?: number | null; due_date?: string }) =>
    apiRequest<TaskItem>('/collab/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTask: (id: string, data: Partial<TaskItem> & { assigned_to_id?: number | null }) =>
    apiRequest<TaskItem>(`/collab/tasks/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTask: (id: string) =>
    apiRequest<void>(`/collab/tasks/${id}/`, {
      method: 'DELETE',
    }),

  // Shared Resources
  getRoomResources: (roomId: string) =>
    apiRequest<{ results: SharedResource[] } | SharedResource[]>(`/collab/resources/?room=${roomId}`),

  createResource: (data: { room: string; title: string; description?: string; resource_type?: string; file_url: string; file_size_bytes?: number }) =>
    apiRequest<SharedResource>('/collab/resources/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  incrementResourceDownload: (id: string) =>
    apiRequest<{ download_count: number }>(`/collab/resources/${id}/increment_download/`, {
      method: 'POST',
    }),

  // Whiteboard
  getWhiteboardState: (roomId: string) =>
    apiRequest<{ room: string; elements_json: string; updated_at: string }>(`/collab/rooms/${roomId}/whiteboard/`),

  saveWhiteboardState: (roomId: string, elements_json: string) =>
    apiRequest<{ room: string; elements_json: string; updated_at: string }>(`/collab/rooms/${roomId}/whiteboard/`, {
      method: 'POST',
      body: JSON.stringify({ elements_json }),
    }),
};
