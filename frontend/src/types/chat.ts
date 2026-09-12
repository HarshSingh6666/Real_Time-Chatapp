export type UserStatus = 'online' | 'away' | 'offline';

export interface User {
  _id: string;        // ✅ MongoDB ID (Backend se aayega)
  id?: string;        // Frontend compatibility ke liye optional
  name: string;
  username: string;   // ✅ New: Search aur Display ke liye
  email: string;      // ✅ New: Profile Modal ke liye
  avatar?: string;
  phone?: string;     // ✅ New: Profile Modal ke liye
  age?: number;       // ✅ New: Settings Update ke liye
  about?: string;     // ✅ New: Bio/About section ke liye
  location?: string;  // ✅ New: Real-time location fetch ke liye
  status?: UserStatus;
  lastSeen?: Date;
  token?: string;     // Login ke waqt token store karne ke liye
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  unreadCount?: number;
}

export interface Channel {
  _id: string;        // ✅ MongoDB ID
  id?: string;        // Frontend ID
  name: string;
  type: 'channel' | 'direct' | 'group';
  participants?: User[];
  
  // ✅ Update: Message object bhi ho sakta hai (Populated data)
  lastMessage?: Message | null; 
  lastMessageTime?: Date;
  unreadCount?: number;
  isArchived?: boolean;
  
  // ✅ New: Backend fields
  admin?: string | User;
  isGroup?: boolean;
}

export type SidebarTab = 'messages' | 'archive' | 'channels' | 'live';

export type MessageType = 'text' | 'image' | 'code';

export interface Message {
  _id: string;        // ✅ MongoDB ID
  id?: string;
  senderId: string;   // Ya fir populated User object ho sakta hai
  sender?: User;      // ✅ Populate hone par ye use hoga
  content: string;
  type: MessageType;
  timestamp: Date | string; // String kyunki DB se ISO string aati hai
  codeLanguage?: string;
  imageUrl?: string;
  channelId?: string;
}

export interface ChatState {
  currentUser: User;
  activeWorkspace: string | null;
  activeChannel: string | null;
  isTyping: boolean;
  typingUser?: string;
}

export interface LiveSession {
  id: string; // Room ID (usually Host Socket ID or User ID)
  title: string;
  host: User;
  participants: number;
  isLive: boolean;
}