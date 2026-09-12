import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Avatar } from '@/components/chat/Avatar';
import { cn } from '@/lib/utils';
import { Message, User } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  users: User[]; 
  onAvatarClick?: (user: User) => void;
}

export const MessageList = ({ messages, currentUserId, users, onAvatarClick }: MessageListProps) => {
  
  // 1. Auto-Scroll Ref
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 2. Safely get user details
  const getUserDetails = (senderId: string | User | undefined) => {
    if (!senderId) return undefined;
    const id = typeof senderId === 'string' ? senderId : senderId._id;
    return users.find(u => u._id === id || u.id === id);
  };

  // 3. SAFE Time formatting
  const renderTime = (msg: Message) => {
    // Try to get a valid date string from either createdAt or timestamp
    const dateString = msg.createdAt || msg.timestamp;
    
    if (!dateString) return 'Sending...'; // If no date exists yet
    
    try {
        const dateObj = new Date(dateString);
        // Check if the date is actually valid before formatting
        if (isNaN(dateObj.getTime())) {
            return 'Sending...';
        }
        return format(dateObj, 'h:mm a');
    } catch (e) {
        return 'Sending...';
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 overflow-y-auto h-full px-2">
      {messages.map((msg, index) => {
        // Safe check for senderId
        if (!msg.senderId) return null; 

        const senderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
        const isMe = senderId === currentUserId;
        const senderDetails = getUserDetails(msg.senderId);

        const prevMsg = messages[index - 1];
        const prevSenderId = prevMsg?.senderId ? (typeof prevMsg.senderId === 'string' ? prevMsg.senderId : prevMsg.senderId._id) : null;
        const isSequence = prevSenderId === senderId;

        const isImage = msg.type === 'image' || (typeof msg.content === 'string' && msg.content.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null);

        // Fallback key creation
        const messageKey = msg._id || `temp-${index}-${Date.now()}`;

        return (
          <div
            key={messageKey} 
            className={cn(
              "flex w-full items-end gap-2",
              isMe ? "justify-end" : "justify-start"
            )}
          >
            {/* Avatar (Left Side) */}
            {!isMe && (
              <div className={cn("shrink-0 w-8", isSequence ? "opacity-0" : "opacity-100")}>
                 <Avatar 
                    user={senderDetails || { name: 'Unknown', _id: '?', email: '' }} 
                    size="sm" 
                    onClick={() => senderDetails && onAvatarClick?.(senderDetails)}
                 />
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={cn(
                "relative max-w-[70%] shadow-sm flex flex-col",
                isImage ? "p-1 bg-transparent border-none shadow-none" : "px-4 py-2",
                "rounded-2xl",
                !isImage && isMe && "rounded-tr-sm bg-primary text-primary-foreground",
                !isImage && !isMe && "rounded-tl-sm bg-secondary/80 text-secondary-foreground border border-border/50",
                "text-sm leading-relaxed break-words"
              )}
            >
              {/* Sender Name in Group Chat */}
              {!isMe && !isSequence && senderDetails && !isImage && (
                <p className="text-[10px] font-bold text-primary/80 mb-1 opacity-70">
                  {senderDetails.name}
                </p>
              )}

              {/* CONTENT */}
              {isImage ? (
                <div className="relative group">
                    <img 
                        src={msg.content} 
                        alt="Sent image" 
                        className={cn(
                            "rounded-lg object-cover cursor-pointer hover:opacity-95 transition-all border border-border/50",
                            "max-w-full sm:max-w-[300px] max-h-[300px]"
                        )}
                        onClick={() => window.open(msg.content, '_blank')}
                    />
                    {/* Time overlay for Image */}
                    <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[10px] text-white/90">
                        {renderTime(msg)}
                    </div>
                </div>
              ) : msg.type === 'code' ? (
                <pre className="bg-black/80 text-white p-3 rounded-lg overflow-x-auto font-mono text-xs my-1">
                    <code>{msg.content}</code>
                </pre>
              ) : (
                <p>{msg.content}</p>
              )}

              {/* Timestamp & Status (Text Only) */}
              {!isImage && (
                <div className={cn(
                    "flex items-center gap-1 mt-1 select-none",
                    isMe ? "justify-end text-primary-foreground/70" : "justify-end text-muted-foreground/70"
                )}>
                    <span className="text-[10px]">
                        {renderTime(msg)}
                    </span>
                    {/* Optionally: You can use `msg._id` presence to toggle Check vs CheckCheck for sent vs delivered */}
                    {isMe && <CheckCheck size={12} className="opacity-80" />}
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* 4. Invisible Div for Scrolling Target */}
      <div ref={scrollRef} />
    </div>
  );
};