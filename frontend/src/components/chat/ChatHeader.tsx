import { Channel, User } from '@/types/chat';
import { Avatar } from './Avatar';
import { 
  Search, 
  Phone, 
  Video, 
  MoreVertical, 
  Hash, 
  Users, 
  Pin, 
  Archive, 
  Info, 
  Eraser, 
  PinOff, 
  X 
} from 'lucide-react'; 
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  channel: Channel;
  participant?: User;
  onSearch: () => void;
  onVideoCall?: () => void;
  onAudioCall?: () => void;
  onViewProfile?: (user: User) => void;
  onPinChat: () => void;
  isPinned: boolean;
  onArchiveChat: () => void;
  onClearChat: () => void;
  
  // ✅ NEW PROPS
  onCloseChat: () => void; 
  isOnline?: boolean; 
}

export const ChatHeader = ({ 
  channel, 
  participant, 
  onSearch, 
  onVideoCall, 
  onAudioCall, 
  onViewProfile,
  onPinChat, 
  isPinned, 
  onArchiveChat, 
  onClearChat,
  onCloseChat, // ✅ Use here
  isOnline = false 
}: ChatHeaderProps) => {
  const isDirectMessage = channel.type === 'direct' && participant;
  
  const getStatusText = (user: User) => {
    if (isOnline) return 'Online';
    if (user.status === 'away') return 'Away';
    if (user.lastSeen) {
      return `Last seen ${formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}`;
    }
    return 'Offline';
  };

  const handleViewProfile = () => {
    if (isDirectMessage && participant && onViewProfile) {
      onViewProfile(participant);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-glass">
      {/* Left Side: Avatar & Name */}
      <div className="flex items-center gap-3">
        {isDirectMessage ? (
          <>
            <button onClick={handleViewProfile} className="cursor-pointer hover:opacity-80 transition-opacity relative">
              <Avatar user={participant} size="lg" />
              {isOnline && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background z-10" />
              )}
            </button>
            <div>
              <h2 className="font-semibold text-foreground">{participant.name}</h2>
              <p className={`text-sm ${isOnline ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>
                {getStatusText(participant)}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
              {channel.type === 'group' ? (
                <Users className="h-6 w-6" />
              ) : (
                <Hash className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{channel.name}</h2>
              <p className="text-sm text-muted-foreground">
                {channel.type === 'group' && channel.participants
                  ? `${channel.participants.length} members`
                  : 'Channel'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Right Side: Action Buttons */}
      <div className="flex items-center gap-1">
        <button onClick={onSearch} className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors" title="Search messages">
          <Search className="h-5 w-5" />
        </button>
        <button onClick={onAudioCall} className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors" title="Voice call">
          <Phone className="h-5 w-5" />
        </button>
        <button onClick={onVideoCall} className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors" title="Video call">
          <Video className="h-5 w-5" />
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors" title="More options">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
            
            {isDirectMessage && (
              <DropdownMenuItem className="cursor-pointer" onClick={handleViewProfile}>
                <Info className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer" onClick={onPinChat}>
              {isPinned ? (
                 <>
                    <PinOff className="mr-2 h-4 w-4" />
                    <span>Unpin Chat</span>
                 </>
              ) : (
                 <>
                    <Pin className="mr-2 h-4 w-4" />
                    <span>Pin Chat</span>
                 </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer" onClick={onArchiveChat}>
              <Archive className="mr-2 h-4 w-4" />
              <span>Archive Chat</span>
            </DropdownMenuItem>

            {/* ✅ NEW: Close Chat Option */}
            <DropdownMenuItem className="cursor-pointer" onClick={onCloseChat}>
              <X className="mr-2 h-4 w-4" />
              <span>Close Chat</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" 
                onClick={() => {
                    if(confirm("Are you sure you want to clear all messages? This cannot be undone.")) {
                        onClearChat();
                    }
                }}
            >
              <Eraser className="mr-2 h-4 w-4" />
              <span>Clear Chat</span>
            </DropdownMenuItem>
            
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};