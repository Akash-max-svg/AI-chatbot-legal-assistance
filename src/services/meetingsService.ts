import { apiClient } from './apiClient';

export interface MeetingParticipant {
  user: {
    _id:   string;
    name:  string;
    email: string;
    role:  string;
  };
  role:     string;
  status:   'invited' | 'accepted' | 'declined' | 'attended';
  joinedAt?: string;
}

export interface Meeting {
  _id:          string;
  title:        string;
  description?: string;
  agenda?:      string;
  caseId?:      string;
  caseNumber?:  string;
  scheduledAt:  string;
  duration:     number;
  platform:     'jitsi' | 'google-meet' | 'zoom' | 'teams' | 'custom';
  meetingLink?: string;
  jitsiLink:    string;
  roomId:       string;
  status:       'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
  createdBy: {
    _id:   string;
    name:  string;
    email: string;
    role:  string;
  };
  participants:  MeetingParticipant[];
  invitesSent:   boolean;
  lastInviteSent?: string;
  minutes?:      string;
  createdAt:     string;
  updatedAt:     string;
}

export interface CreateMeetingData {
  title:          string;
  description?:   string;
  agenda?:        string;
  caseId?:        string;
  caseNumber?:    string;
  scheduledAt:    string;
  duration?:      number;
  platform?:      string;
  meetingLink?:   string;
  participantIds: string[];
  timezone?:      string;
}

export interface UserSearchResult {
  _id:   string;
  name:  string;
  email: string;
  role:  string;
}

export const meetingsService = {
  // Create a new meeting (Judge/Lawyer only)
  async createMeeting(data: CreateMeetingData): Promise<{ meeting: Meeting; message: string }> {
    return apiClient.post('/meetings', data);
  },

  // Get all meetings for current user
  async getMeetings(filters?: { status?: string; upcoming?: boolean }): Promise<{ meetings: Meeting[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status)              params.set('status', filters.status);
    if (filters?.upcoming !== undefined) params.set('upcoming', String(filters.upcoming));
    const qs = params.toString();
    return apiClient.get(`/meetings${qs ? '?' + qs : ''}`);
  },

  // Get single meeting
  async getMeeting(id: string): Promise<{ meeting: Meeting }> {
    return apiClient.get(`/meetings/${id}`);
  },

  // Update meeting
  async updateMeeting(id: string, data: Partial<CreateMeetingData> & { addParticipantIds?: string[] }): Promise<{ meeting: Meeting }> {
    return apiClient.put(`/meetings/${id}`, data);
  },

  // Cancel meeting
  async cancelMeeting(id: string, reason?: string): Promise<{ message: string }> {
    return apiClient.delete(`/meetings/${id}`, { reason });
  },

  // Get join link
  async joinMeeting(id: string): Promise<{ joinLink: string; jitsiLink: string; roomId: string; platform: string }> {
    return apiClient.post(`/meetings/${id}/join`, {});
  },

  // Accept or decline invitation
  async respondToInvite(meetingId: string, userId: string, status: 'accepted' | 'declined'): Promise<{ message: string }> {
    return apiClient.put(`/meetings/${meetingId}/participants/${userId}`, { status });
  },

  // Resend invitations
  async resendInvites(id: string): Promise<{ message: string }> {
    return apiClient.post(`/meetings/${id}/resend-invites`, {});
  },

  // Search users to invite
  async searchUsers(query: string, role?: string): Promise<{ users: UserSearchResult[] }> {
    const params = new URLSearchParams({ q: query });
    if (role) params.set('role', role);
    return apiClient.get(`/meetings/users/search?${params}`);
  },
};
