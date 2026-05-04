import { apiClient } from '../lib/api';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

export class ChatService {
  static async getMessages() {
    const response = await apiClient.get('/chat');
    return response.data;
  }

  static async sendMessage(receiver_id: string, message: string) {
    const response = await apiClient.post('/chat', {
      receiver_id,
      message
    });
    return response.data;
  }
}
