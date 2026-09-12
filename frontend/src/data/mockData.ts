import { User, Workspace, Channel, Message } from '@/types/chat';

export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Chen',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  status: 'online',
};

export const users: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Sarah Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    status: 'online',
  },
  {
    id: 'user-3',
    name: 'Mike Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    status: 'away',
    lastSeen: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: 'user-4',
    name: 'Emma Davis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    status: 'offline',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'user-5',
    name: 'James Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    status: 'online',
  },
  {
    id: 'user-6',
    name: 'Olivia Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    status: 'online',
  },
];

export const workspaces: Workspace[] = [
  { id: 'ws-1', name: 'Design Team', icon: '🎨', unreadCount: 3 },
  { id: 'ws-2', name: 'Engineering', icon: '⚡', unreadCount: 12 },
  { id: 'ws-3', name: 'Marketing', icon: '📈' },
  { id: 'ws-4', name: 'Support', icon: '💬', unreadCount: 5 },
];

export const channels: Channel[] = [
  {
    id: 'ch-1',
    name: 'general',
    type: 'channel',
    lastMessage: 'Hey everyone! 👋',
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
    unreadCount: 2,
  },
  {
    id: 'ch-2',
    name: 'design-reviews',
    type: 'channel',
    lastMessage: 'The new mockups look great!',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'ch-3',
    name: 'random',
    type: 'channel',
    lastMessage: 'Anyone up for lunch?',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 5,
  },
  {
    id: 'dm-1',
    name: 'Sarah Wilson',
    type: 'direct',
    participants: [users[1]],
    lastMessage: 'Can you review my PR?',
    lastMessageTime: new Date(Date.now() - 10 * 60 * 1000),
    unreadCount: 1,
  },
  {
    id: 'dm-2',
    name: 'Mike Johnson',
    type: 'direct',
    participants: [users[2]],
    lastMessage: 'Thanks for the help!',
    lastMessageTime: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: 'dm-3',
    name: 'Emma Davis',
    type: 'direct',
    participants: [users[3]],
    lastMessage: 'See you tomorrow!',
    lastMessageTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: 'grp-1',
    name: 'Project Alpha',
    type: 'group',
    participants: [users[1], users[2], users[4]],
    lastMessage: 'Sprint planning at 2pm',
    lastMessageTime: new Date(Date.now() - 20 * 60 * 1000),
    unreadCount: 3,
  },
];

export const messages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'user-2',
    content: 'Hey Alex! How\'s the new feature coming along?',
    type: 'text',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: 'msg-2',
    senderId: 'user-1',
    content: 'Going great! Just finished the main component. Check it out:',
    type: 'text',
    timestamp: new Date(Date.now() - 55 * 60 * 1000),
  },
  {
    id: 'msg-3',
    senderId: 'user-1',
    content: `const ChatMessage = ({ message, isOwn }) => {
  return (
    <div className={\`message \${isOwn ? 'sent' : 'received'}\`}>
      <p>{message.content}</p>
      <span>{formatTime(message.timestamp)}</span>
    </div>
  );
};`,
    type: 'code',
    codeLanguage: 'typescript',
    timestamp: new Date(Date.now() - 54 * 60 * 1000),
  },
  {
    id: 'msg-4',
    senderId: 'user-2',
    content: 'That looks clean! Love the glassmorphism effect 🔥',
    type: 'text',
    timestamp: new Date(Date.now() - 50 * 60 * 1000),
  },
  {
    id: 'msg-5',
    senderId: 'user-2',
    content: 'Here\'s the design reference I was talking about:',
    type: 'text',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: 'msg-6',
    senderId: 'user-2',
    content: '',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop',
    timestamp: new Date(Date.now() - 44 * 60 * 1000),
  },
  {
    id: 'msg-7',
    senderId: 'user-1',
    content: 'Perfect! I\'ll use this as reference. The gradient is exactly what we need.',
    type: 'text',
    timestamp: new Date(Date.now() - 40 * 60 * 1000),
  },
  {
    id: 'msg-8',
    senderId: 'user-2',
    content: 'By the way, Mike wanted to join the call later. He has some feedback on the UX flow.',
    type: 'text',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'msg-9',
    senderId: 'user-1',
    content: 'Sounds good! I\'ll be ready around 3pm. Just need to finish testing the responsive layout.',
    type: 'text',
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: 'msg-10',
    senderId: 'user-2',
    content: 'Can you also share the updated API schema? I need to update the backend handlers.',
    type: 'text',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: 'msg-11',
    senderId: 'user-1',
    content: `interface MessagePayload {
  id: string;
  content: string;
  type: 'text' | 'image' | 'code';
  senderId: string;
  channelId: string;
  timestamp: number;
  metadata?: {
    imageUrl?: string;
    codeLanguage?: string;
  };
}`,
    type: 'code',
    codeLanguage: 'typescript',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: 'msg-12',
    senderId: 'user-2',
    content: 'Thanks! This is exactly what I needed. I\'ll get started on the socket handlers now.',
    type: 'text',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
];

export const getUserById = (id: string): User | undefined => {
  return users.find(user => user.id === id);
};

export const getChannelById = (id: string): Channel | undefined => {
  return channels.find(channel => channel.id === id);
};
