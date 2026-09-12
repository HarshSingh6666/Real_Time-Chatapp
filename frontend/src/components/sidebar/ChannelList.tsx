import { Channel, User, SidebarTab } from '@/types/chat';
import { Avatar } from '@/components/chat/Avatar';
import { cn } from '@/lib/utils';
import { 
  Users, 
  ChevronDown, 
  Plus, 
  Search, 
  Archive, 
  MoreVertical, 
  Pin, 
  Trash2, 
  ArchiveRestore, 
  PinOff,
  MessageSquare
} from 'lucide-react'; 
import { format } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';

import { SidebarTabs } from './SidebarTabs';
import { LiveSection } from './LiveSection';
import { SearchPage } from './SearchPage'; 

interface ChannelListProps {
  channels: Channel[];
  activeChannel: string | null;
  onChannelSelect: (id: string) => void;
  currentUser: User;
  onArchiveChannel: (id: string) => void;
  onUnarchiveChannel: (id: string) => void;
  onSettingsClick?: () => void;
  onChannelJoined?: (channel: Channel) => void;
  onRemoveChannel: (id: string) => void;
  pinnedChannels: string[];
  onTogglePin: (id: string) => void;
  onlineUsers: string[];
  onProfileClick: () => void;
}

export const ChannelList = ({
  channels = [],
  activeChannel,
  onChannelSelect,
  currentUser,
  onArchiveChannel,
  onUnarchiveChannel,
  onSettingsClick,
  onChannelJoined,
  onRemoveChannel,
  pinnedChannels = [],
  onlineUsers = [],
  onTogglePin,
  onProfileClick,
}: ChannelListProps) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('messages');
  const [isSearching, setIsSearching] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close context menu on global click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const [expandedSections, setExpandedSections] = useState({
    channels: true,
    directMessages: true,
    groups: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // ✅ MEMOIZED SORTING & FILTERING (Performance Boost)
  const { channelItems, directMessages, groups, archivedChannels } = useMemo(() => {
    const active = channels.filter(c => !c.isArchived);
    const archived = channels.filter(c => c.isArchived);

    const sortFn = (a: Channel, b: Channel) => {
      const idA = a._id || a.id;
      const idB = b._id || b.id;
      
      // Pin Priority
      const isPinnedA = pinnedChannels?.includes(idA); 
      const isPinnedB = pinnedChannels?.includes(idB);
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      
      // Time Priority
      const timeA = new Date(a.lastMessageTime || a.updatedAt || 0).getTime();
      const timeB = new Date(b.lastMessageTime || b.updatedAt || 0).getTime();
      return timeB - timeA;
    };

    return {
      channelItems: active.filter(c => c.type === 'channel').sort(sortFn),
      directMessages: active.filter(c => c.type === 'direct' || (!c.isGroup && c.type !== 'channel')).sort(sortFn),
      groups: active.filter(c => c.isGroup || c.type === 'group').sort(sortFn),
      archivedChannels: archived.sort(sortFn)
    };
  }, [channels, pinnedChannels]);

  const renderChannelItem = (channel: Channel) => {
    const channelId = channel._id || channel.id;
    const isGroup = channel.isGroup || channel.type === 'group' || channel.type === 'channel';
    
    // ✅ ROBUST PARTICIPANT FINDER
    const otherUser = channel.participants?.find((p: any) => {
        const pId = typeof p === 'string' ? p : (p._id || p.id);
        const currentId = currentUser._id || currentUser.id;
        return pId !== currentId;
    });

    const displayName = isGroup 
        ? (channel.name || "Unnamed Group") 
        : (typeof otherUser === 'object' && otherUser?.name ? otherUser.name : "Unknown User");

    const isActive = activeChannel === channelId;
    const isPinned = pinnedChannels?.includes(channelId);
    
    const otherUserId = typeof otherUser === 'object' ? (otherUser._id || otherUser.id) : otherUser;
    const isOnline = !isGroup && otherUserId && onlineUsers.includes(otherUserId);
    
    // ✅ Safe Date Formatting
    const timeDisplay = channel.lastMessageTime && !isNaN(new Date(channel.lastMessageTime).getTime())
        ? format(new Date(channel.lastMessageTime), 'h:mm a')
        : null;

    return (
      <div
        key={channelId}
        className={cn(
          'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative mb-1',
          'hover:bg-secondary/50',
          isActive && 'bg-secondary shadow-sm ring-1 ring-border/50',
          openMenuId === channelId && 'bg-secondary/70'
        )}
      >
        <button
          onClick={() => onChannelSelect(channelId)}
          className="flex-1 flex items-center gap-3 min-w-0 text-left"
        >
          <div className="relative shrink-0">
            {isGroup ? (
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                   <Users className="h-5 w-5" />
                </div>
            ) : (
                <Avatar 
                    user={typeof otherUser === 'object' ? otherUser : { name: displayName, _id: otherUserId } as User} 
                    size="md" 
                />
            )}
            {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full bg-green-500 border-2 border-background shadow-sm" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className={cn(
                  'text-sm truncate flex items-center gap-1.5', 
                  isActive ? 'font-bold text-foreground' : 'font-medium text-foreground/90'
              )}>
                {displayName}
                {isPinned && <Pin size={10} className="text-primary rotate-45 fill-primary" />}
              </span>
              {timeDisplay && (
                <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                  {timeDisplay}
                </span>
              )}
            </div>
            
            <p className="text-xs truncate text-muted-foreground/70">
                {channel.lastMessage ? (
                    typeof channel.lastMessage === 'string' 
                        ? channel.lastMessage 
                        : (channel.lastMessage as any).content || "Sent an attachment"
                ) : isOnline ? <span className="text-green-500/80 font-medium italic">Active Now</span> : "No messages yet"}
            </p>
          </div>

          {channel.unreadCount ? channel.unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
              {channel.unreadCount}
            </span>
          ) : null}
        </button>

        {/* Context Menu Button */}
        <button
            onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === channelId ? null : channelId);
            }}
            className={cn(
                "p-1.5 rounded-lg text-muted-foreground hover:bg-background hover:text-foreground transition-all ml-1",
                openMenuId === channelId ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
        >
            <MoreVertical size={14} />
        </button>

        {/* Dropdown Menu */}
        {openMenuId === channelId && (
            <div className="absolute right-2 top-12 w-44 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-1.5">
                    <button onClick={(e) => { e.stopPropagation(); onTogglePin(channelId); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-secondary transition-colors">
                        {isPinned ? <PinOff size={14} /> : <Pin size={14} />} {isPinned ? 'Unpin' : 'Pin Chat'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onArchiveChannel(channelId); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-secondary transition-colors">
                        <Archive size={14} /> Archive Chat
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button onClick={(e) => { e.stopPropagation(); onRemoveChannel(channelId); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                        <Trash2 size={14} /> Delete Chat
                    </button>
                </div>
            </div>
        )}
      </div>
    );
  };

  const renderSection = (title: string, items: Channel[], sectionKey: keyof typeof expandedSections) => {
    // Only render if items exist OR if it's the main sections to maintain structure
    if (items.length === 0) return null; 

    return (
      <div className="mb-6">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors group"
        >
          <div className="flex items-center gap-2">
            <ChevronDown className={cn('h-3 w-3 transition-transform duration-300', !expandedSections[sectionKey] && '-rotate-90')} />
            {title}
          </div>
          <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        {expandedSections[sectionKey] && (
          <div className="mt-1">{items.map((item) => renderChannelItem(item))}</div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'messages':
        return (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Bar */}
            <div className="p-4">
              <button 
                onClick={() => setIsSearching(true)}
                className="w-full relative group"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary/40 border border-transparent rounded-xl text-left text-muted-foreground hover:bg-secondary/60 transition-all">
                    Search or start a new chat...
                </div>
              </button>
            </div>

            {/* Lists */}
            <div className="flex-1 overflow-y-auto px-2 pb-20 scrollbar-hide"> 
              {renderSection('Direct Messages', directMessages, 'directMessages')}
              {renderSection('Groups', groups, 'groups')}
              {renderSection('Channels', channelItems, 'channels')}
              
              {/* Empty State */}
              {directMessages.length === 0 && groups.length === 0 && channelItems.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50">
                    <MessageSquare size={40} strokeWidth={1.5} className="mb-2" />
                    <p className="text-sm">No conversations yet</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'archive':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Archive size={16} /> Archived Chats ({archivedChannels.length})
            </h3>
            {archivedChannels.length > 0 ? (
              <div className="space-y-2">
                {archivedChannels.map((c) => (
                  <div key={c._id || c.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50 shadow-sm">
                      <span className="text-sm font-semibold">{c.name || "Archived Chat"}</span>
                      <button 
                        onClick={() => onUnarchiveChannel(c._id || c.id)} 
                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      >
                        <ArchiveRestore size={16} />
                      </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30">
                <Archive size={40} className="mb-3 opacity-20" />
                <p className="text-sm">No archived chats</p>
              </div>
            )}
          </div>
        );
      case 'live':
        return <LiveSection currentUser={currentUser} onJoinLive={() => {}} onStartLive={() => {}} />;
      default:
        return null;
    }
  };

  return (
    <aside className="flex h-full bg-card/30 backdrop-blur-xl border-r border-border/50">
      <SidebarTabs
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setIsSearching(false); }}
        archiveCount={archivedChannels.length}
        onSettingsClick={onSettingsClick}
        onSearchClick={() => setIsSearching(true)} 
        currentUser={currentUser} 
        onProfileClick={onProfileClick}
      />

      <div className="flex flex-col flex-1 w-[280px] lg:w-[320px]">
        <div className="flex-1 flex flex-col overflow-hidden">
          {isSearching ? (
            <SearchPage 
                onSelectChannel={(channel) => {
                    if (onChannelJoined) onChannelJoined(channel);
                    onChannelSelect(channel._id || channel.id);
                    setIsSearching(false);
                }} 
                onClose={() => setIsSearching(false)} 
            />
          ) : renderTabContent()}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-border/50 bg-background/20">
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-tr from-secondary/50 to-secondary/30 w-full hover:from-secondary hover:to-secondary transition-all text-left border border-border/50 shadow-sm group"
          >
            <Avatar user={currentUser} size="md" isOnline={true}/>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{currentUser.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Active Now</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};