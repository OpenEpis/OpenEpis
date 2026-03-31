import type { Conversation } from "@openepis/types";
import type { HttpClient } from "../client.js";

export interface ConversationListItem {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationListResponse {
  conversations: ConversationListItem[];
}

export interface ApplyResponse {
  applied_features: string[];
}

export class ConversationsResource {
  constructor(private http: HttpClient) {}

  list(projectId: string): Promise<ConversationListResponse> {
    return this.http.get(`/api/projects/${projectId}/conversations`);
  }

  get(id: string): Promise<Conversation> {
    return this.http.get(`/api/conversations/${id}`);
  }

  create(projectId: string): Promise<Conversation> {
    return this.http.post(`/api/projects/${projectId}/conversations`, {});
  }

  delete(id: string): Promise<void> {
    return this.http.delete(`/api/conversations/${id}`);
  }

  apply(id: string): Promise<ApplyResponse> {
    return this.http.post(`/api/conversations/${id}/apply`);
  }

  discard(id: string): Promise<{ ok: boolean }> {
    return this.http.post(`/api/conversations/${id}/discard`);
  }
}
