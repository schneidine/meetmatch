export type Screen = 'login' | 'signup' | 'interests' | 'settings' | 'main';
export type MainTab = 'chat' | 'matches' | 'events' | 'profile';
export type ChatView = 'threads' | 'thread';

export const MAIN_TABS: MainTab[] = ['chat', 'matches', 'events', 'profile'];

export type ChatMessage = {
  id: string;
  sender: 'You' | 'Them';
  text: string;
  ts: number;
};

export type ChatThread = {
  id: string;
  title: string;
  avatar?: string;
  lastMessage: string;
  messages: ChatMessage[];
};

export type MatchProfile = {
  id: string;
  name: string;
  age: number;
  image: string;
  location: string;
  bio: string;
  interests: string[];
  prompt: string;
  matchReason: string;
};

export type SwipeAction = 'pass' | 'like';

export type UserSummary = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  location?: string;
};

export type Interest = {
  id: number;
  name: string;
};

export type SignupForm = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  age: string;
  password: string;
  location: string;
};

export type EventSummary = {
  id: number;
  name: string;
  description: string;
  date_time: string;
  source: string;
  creator_username: string;
  interested_count: number;
  category_names: string[];
  latitude: number | null;
  longitude: number | null;
};