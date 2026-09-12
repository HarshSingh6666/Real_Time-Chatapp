import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Menu, MessageSquare, Loader2, Radio, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

import { ChannelList } from '@/components/sidebar/ChannelList';
import { MobileDrawer } from '@/components/sidebar/MobileDrawer';
import { LiveSection } from '@/components/sidebar/LiveSection';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList'; 
import { ChatInput } from '@/components/chat/ChatInput';
import { SearchBar } from '@/components/chat/SearchBar';
import { UserSearchModal } from '@/components/chat/UserSearchModal';
// ✅ Import thekaam ho gaya - sirf SettingsModal import karna hai
import { SettingsModal } from '@/components/settings/SettingsModal';
import { VideoCallModal } from '@/components/call/VideoCallModal';
import { UserProfileModal } from '@/components/profile/UserProfileModal';

import { addStoredAccount } from '@/lib/accountUtils';
import { Message, MessageType, Channel, User } from '@/types/chat';

const SOCKET_URL = 'https://opentalks.onrender.com';

interface ChatLayoutProps {
  user: User;
  onOpenSearch: () => void;
  onUserUpdate: (user: User) => void;
}

export const ChatLayout = ({ user, onOpenSearch, onUserUpdate }: ChatLayoutProps) => {
  const navigate = useNavigate();
  const socket = useRef<Socket | null>(null);
  
  // --- STATE ---
  const [activeChannel, setActiveChannel] = useState<string | null>(() => localStorage.getItem('activeChannel') || null);
  const [sidebarView, setSidebarView] = useState<'chats' | 'live'>('chats');
  const [isConnected, setIsConnected] = useState(false);
  const activeChannelRef = useRef(activeChannel);

  const [messages, setMessages] = useState<Message[]>([]);
  const [channelsList, setChannelsList] = useState<Channel[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarLoading, setIsSidebarLoading] = useState(true); 

  // UI States
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // ✅ Settings State
  
  // Call & Online States
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState<any>(null);
  const [callerData, setCallerData] = useState<{ from: string; name: string } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- RESIZE STATE ---
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 320;
  });
  const isResizing = useRef(false);
  
  const [pinnedChannels, setPinnedChannels] = useState<string[]>(() => {
    const saved = localStorage.getItem('pinnedChannels');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync Refs
  useEffect(() => {
    activeChannelRef.current = activeChannel;
    if (activeChannel) localStorage.setItem('activeChannel', activeChannel);
    else localStorage.removeItem('activeChannel');
  }, [activeChannel]);

  useEffect(() => {
    localStorage.setItem('pinnedChannels', JSON.stringify(pinnedChannels));
  }, [pinnedChannels]);

  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  // --- SIDEBAR RESIZE LOGIC ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      let newWidth = e.clientX;
      if (newWidth < 260) newWidth = 260; 
      if (newWidth > 550) newWidth = 550; 
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto'; 
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; 
  }, []);

  // --- 1. INITIALIZATION & SOCKET SETUP ---
  useEffect(() => {
    const initData = async () => {
        const token = localStorage.getItem('token');
        if (!user?._id || !token) return;

        addStoredAccount(token, user);
        
        if (socket.current) socket.current.disconnect();

        socket.current = io(SOCKET_URL, { 
            auth: { token },
            query: { userId: user._id } 
        });

        socket.current.on('connect', () => setIsConnected(true));
        socket.current.on('disconnect', () => setIsConnected(false));

        socket.current.on('receive_message', (msg: Message) => {
            const msgSenderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
            if (msgSenderId === user._id) return;

            const msgChatId = typeof msg.channelId === 'string' 
                ? msg.channelId 
                : (msg.channelId as any)?._id || (msg.channelId as any)?.id;

            const currentActiveId = activeChannelRef.current;

            setChannelsList(prev => {
                return prev.map(c => {
                    const cId = c.id || c._id;
                    if (cId === msgChatId) return { ...c, lastMessage: msg, lastMessageTime: msg.timestamp };
                    return c;
                });
            });

            if (currentActiveId === msgChatId) {
                setMessages(prev => {
                    if (prev.some(m => m._id === msg._id)) return prev; 
                    return [...prev, msg];
                });
            }
        });

        socket.current.on('callUser', (data: any) => {
            setIncomingCall(true);
            setCallerSignal(data.signal);
            setCallerData({ from: data.from, name: data.name });
            setIsCallActive(true);
            setIsVideoCall(true);
        });

        socket.current.on('get-users', (users: any[]) => {
            setOnlineUsers(users.map((u) => u.userId));
        });

        socket.current.emit('setup', user);
    };

    initData();
    return () => { if(socket.current) socket.current.disconnect(); };
  }, [user?._id]);

  useEffect(() => {
    if (activeChannel && socket.current && isConnected) {
        socket.current.emit('join_channel', activeChannel);
    }
  }, [activeChannel, isConnected]); 

  // --- 3. FETCH DATA ---
  const fetchChats = useCallback(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setIsSidebarLoading(false); return; }
        
        setIsSidebarLoading(true);
        const { data } = await axios.get(`${SOCKET_URL}/api/chat`, { headers: { Authorization: `Bearer ${token}` } });
        const chatData = Array.isArray(data) ? data : [];
        const formattedChats = chatData.map((c: any) => ({
           ...c, id: c._id, type: c.isGroup ? 'group' : 'direct', participants: c.participants || [] 
        }));
        setChannelsList(formattedChats);
      } catch (error: any) {
        if (error.response?.status === 401) { localStorage.clear(); navigate("/"); }
      } finally { setIsSidebarLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchChats(); }, [user, fetchChats]);

  useEffect(() => {
    if (!activeChannel) return;
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${SOCKET_URL}/api/messages/${activeChannel}`, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(res.data);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchMessages();
  }, [activeChannel]);

  // --- HANDLERS ---
  const handleSendMessage = useCallback(async (content: string, type: MessageType) => {
      if (!activeChannel || !content.trim()) return;
      const tempId = Date.now().toString();
      const optimisticMessage: any = {
          _id: tempId, channelId: activeChannel, senderId: user, content: content.trim(),
          type, timestamp: new Date().toISOString(), createdAt: new Date().toISOString(), readBy: []
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setChannelsList(prev => prev.map(c => {
           if ((c.id || c._id) === activeChannel) return { ...c, lastMessage: optimisticMessage, lastMessageTime: optimisticMessage.timestamp };
           return c;
      }));
      
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${SOCKET_URL}/api/messages`, { chatId: activeChannel, content: content.trim(), type }, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(prev => prev.map(msg => msg._id === tempId ? res.data : msg));
      } catch (e) { 
          toast.error("Failed to send");
          setMessages(prev => prev.filter(msg => msg._id !== tempId));
      }
    }, [activeChannel, user]
  );

  const handleNewChatSelect = async (selectedUser: User) => {
    setIsNewChatOpen(false);
    setIsSettingsOpen(false); // ✅ Chat khulte hi settings close
    const existing = channelsList.find(c => c.type === 'direct' && c.participants.some(p => (p._id === selectedUser._id || p.id === selectedUser._id)));
    if (existing) { setActiveChannel(existing.id || existing._id); return; }

    try {
        const token = localStorage.getItem('token');
        const { data } = await axios.post(`${SOCKET_URL}/api/chat`, { userId: selectedUser._id }, { headers: { Authorization: `Bearer ${token}` } });
        const newChannel = { ...data, id: data._id, type: 'direct', participants: data.participants };
        setChannelsList(prev => [newChannel, ...prev]);
        setActiveChannel(newChannel.id);
    } catch (e) { toast.error("Failed to open chat"); }
  };

  const handleSearchSelect = async (selectedUser: User) => {
    setIsSearchOpen(false);
    handleNewChatSelect(selectedUser);
  };

  const handleStartLive = () => window.open(`/live/${`live-${user._id}-${Date.now()}`}?role=host`, '_blank');
  const handleJoinLive = (session: any) => window.open(`/live/${session.id}?role=viewer`, '_blank');
  const handleTogglePin = (channelId: string) => setPinnedChannels(prev => prev.includes(channelId) ? prev.filter(id => id !== channelId) : [...prev, channelId]);

  const handleArchiveChannel = async (id: string) => { /* ...existing logic... */ };
  const handleUnarchiveChannel = async (id: string) => { /* ...existing logic... */ };
  const handleRemoveChannel = async (id: string) => { /* ...existing logic... */ };
  const handleClearMessages = async () => { /* ...existing logic... */ };

  const handleCloseChat = () => setActiveChannel(null);

  // Helpers
  const channel = Array.isArray(channelsList) ? channelsList.find(c => (c.id === activeChannel || c._id === activeChannel)) : null;
  let participant = channel?.participants.find(p => p._id !== user._id) || (channel?.participants && channel.participants.length > 0 ? channel.participants[0] : undefined);
  
  const callParticipant = incomingCall && callerData ? { _id: callerData.from, name: callerData.name } as User : participant;
  const isParticipantOnline = participant && onlineUsers.includes(participant._id);
  const showLoading = isSidebarLoading || (activeChannel && !channel);

  const existingChatUserIds = channelsList.filter(c => c.type === 'direct').map(c => {
       const partner = c.participants.find(p => String(p._id || (p as any).id) !== String(user._id || (user as any).id));
       return partner ? String(partner._id || (partner as any).id) : null;
  }).filter((id): id is string => Boolean(id));

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden">
      
      {/* ✅ 1. SettingsModal yahan root par aayega, taaki sabke upar popup/overlay bane */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={user} 
        onUserUpdate={onUserUpdate} 
      />

      <UserProfileModal user={profileUser} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      
      <UserSearchModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
        onSelectUser={handleNewChatSelect}
        currentUser={user}
        existingChatUserIds={existingChatUserIds}
      />

      {isCallActive && callParticipant && (
        <VideoCallModal 
            isOpen={isCallActive} 
            onClose={() => { setIsCallActive(false); setIncomingCall(false); }} 
            participant={callParticipant} currentUser={user} isVideoCall={isVideoCall} socket={socket.current} isIncomingCall={incomingCall} callerSignal={callerSignal} 
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className="hidden md:flex flex-col h-full flex-shrink-0 border-r border-border bg-card" style={{ width: `${sidebarWidth}px` }}>
        <div className="flex-none p-4 pb-0">
            <h2 className="font-bold text-xl tracking-tight">OpenTalks</h2>
        </div>
        <div className="flex-none flex items-center p-2 m-2 bg-secondary/30 rounded-lg">
            <button onClick={() => setSidebarView('chats')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${sidebarView === 'chats' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:bg-background/50'}`}>
                <MessageCircle size={16} /> Chats
            </button>
            <button onClick={() => setSidebarView('live')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${sidebarView === 'live' ? 'bg-background shadow text-destructive' : 'text-muted-foreground hover:bg-background/50'}`}>
                <Radio size={16} /> Live
            </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar"> 
            {isSidebarLoading ? (
                <div className="flex h-full justify-center items-center"><Loader2 className="animate-spin" /></div>
            ) : (
                <>
                    {sidebarView === 'chats' ? (
                        <ChannelList
                            channels={channelsList} activeChannel={activeChannel} currentUser={user}
                            onChannelSelect={(id) => { 
                                setActiveChannel(id); 
                                setIsSettingsOpen(false);
                            }} 
                            onSettingsClick={() => setIsSettingsOpen(true)} // ✅ Button dabane pe state True hogi
                            onArchiveChannel={handleArchiveChannel} onUnarchiveChannel={handleUnarchiveChannel} onRemoveChannel={handleRemoveChannel}
                            pinnedChannels={pinnedChannels} onTogglePin={handleTogglePin} onlineUsers={onlineUsers}
                            onProfileClick={() => { setProfileUser(user); setIsProfileOpen(true); }}
                            onChannelJoined={(nc) => { setChannelsList(p => [nc, ...p]); setActiveChannel(nc.id); setIsSettingsOpen(false); }}
                        />
                    ) : (
                        <LiveSection currentUser={user} socket={socket.current} onStartLive={handleStartLive} onJoinLive={handleJoinLive} />
                    )}
                </>
            )}
        </div>
      </aside>

      <div onMouseDown={startResizing} className="hidden md:block w-1 cursor-col-resize bg-border hover:bg-primary/50 hover:w-1.5 transition-all active:bg-primary z-10" />

      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} channels={channelsList} activeChannel={activeChannel} currentUser={user} onChannelSelect={(id) => { setActiveChannel(id); setIsDrawerOpen(false); setIsSettingsOpen(false); }} onProfileClick={() => { setProfileUser(user); setIsProfileOpen(true); }} />

      {/* --- MAIN AREA (RIGHT PANE) --- */}
      <main className="flex-1 flex flex-col min-w-0 h-full bg-slate-50 dark:bg-zinc-950/50 relative overflow-hidden">
        
        {/* ✅ CONDITION 1: LOADING */}
        {showLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center"><Loader2 className="animate-spin" /></div>
        ) : 
        /* ✅ CONDITION 2: CHAT IS SELECTED */
        channel ? (
          <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
            <div className="md:hidden flex-none flex items-center justify-between p-3 border-b bg-card">
                <button onClick={() => setIsDrawerOpen(true)}><Menu /></button>
                <span className="font-bold">{participant?.name || channel?.name || "Chat"}</span>
            </div>
            
            <div className="flex-none">
                <ChatHeader channel={channel} participant={participant} onSearch={() => setIsSearchOpen(true)} onVideoCall={() => { setIsVideoCall(true); setIsCallActive(true); }} onAudioCall={() => { setIsVideoCall(false); setIsCallActive(true); }} onViewProfile={u => { setProfileUser(u); setIsProfileOpen(true); }} onPinChat={() => handleTogglePin(channel.id || channel._id)} isPinned={pinnedChannels.includes(channel.id || channel._id)} onArchiveChat={() => handleArchiveChannel(channel.id || channel._id)} onClearChat={handleClearMessages} onCloseChat={handleCloseChat} isOnline={isParticipantOnline} />
            </div>

            {isSearchOpen && <SearchBar onSearch={handleSearchSelect} onClose={() => setIsSearchOpen(false)} />}
            
            <div className="flex-1 overflow-y-auto min-h-0 px-4 custom-scrollbar">
               {isLoading ? (
                   <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>
               ) : (
                   <MessageList messages={messages} currentUserId={user._id} users={channel.participants} onAvatarClick={u => { setProfileUser(u); setIsProfileOpen(true); }} />
               )}
            </div>
            <div className="flex-none p-4 bg-background/50 backdrop-blur-sm">
                <ChatInput onSendMessage={handleSendMessage} />
            </div>
          </div>
        ) : 
        /* ✅ CONDITION 3: EMPTY STATE */
        (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
             <div className="md:hidden absolute top-4 left-4">
                 <button onClick={() => setIsDrawerOpen(true)} className="p-2 bg-secondary rounded-lg text-foreground"><Menu /></button>
             </div>
             <MessageSquare size={48} className="opacity-50" />
             <p className="mt-4 font-medium text-lg text-foreground">OpenTalks for Web</p>
             <p className="mt-2 text-sm max-w-sm text-center">Select a chat from the sidebar or start a new conversation.</p>
             <button onClick={() => setIsNewChatOpen(true)} className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                 Start New Chat
             </button>
          </div>
        )}
      </main>
    </div>
  );
};