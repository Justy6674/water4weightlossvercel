export type MessageType = 'info' | 'achievement' | 'reminder' | 'tip';

export interface Message {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  read: boolean;
}
