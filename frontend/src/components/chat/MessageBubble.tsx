import { Message, User } from '@/types/chat';
import { Avatar } from './Avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  sender: User;
  isOwn: boolean;
  showAvatar?: boolean;
  onAvatarClick?: (user: User) => void;
}

export const MessageBubble = ({ message, sender, isOwn, showAvatar = true, onAvatarClick }: MessageBubbleProps) => {
  
  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="overflow-hidden rounded-lg">
            <img
              // ✅ FIX: Agar imageUrl nahi hai toh content use karo (Fallback)
              src={message.imageUrl || message.content} 
              alt="Shared image"
              className="max-w-[280px] md:max-w-[360px] object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
              // ✅ Image load error handle karein
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        );
      case 'code':
        return (
          <div className="overflow-hidden rounded-lg border border-border/50">
            <div className="flex items-center justify-between bg-zinc-950 px-3 py-1.5 border-b border-border/50">
              <span className="text-xs text-zinc-400 font-mono">
                {message.codeLanguage || 'javascript'}
              </span>
            </div>
            <pre className="p-3 bg-zinc-900 overflow-x-auto scrollbar-thin max-w-[300px] md:max-w-[400px]">
              <code className="text-sm font-mono text-zinc-100">{message.content}</code>
            </pre>
          </div>
        );
      default:
        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>;
    }
  };

  const handleAvatarClick = () => {
    if (onAvatarClick && !isOwn) {
      onAvatarClick(sender);
    }
  };

  // ✅ FIX: Date formatting safety check
  const formattedTime = (() => {
    try {
        return format(new Date(message.timestamp), 'h:mm a');
    } catch (e) {
        return "";
    }
  })();

  return (
    <div
      className={cn(
        'flex gap-3 max-w-[85%] md:max-w-[70%] animate-in fade-in slide-in-from-bottom-2 duration-300',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {showAvatar && !isOwn && (
        <button 
          onClick={handleAvatarClick}
          className="cursor-pointer hover:opacity-80 transition-opacity mt-auto mb-1" // Avatar bottom align looks better usually
        >
          <Avatar user={sender} size="sm" showStatus={false} />
        </button>
      )}
      
      {/* Spacer agar avatar hidden hai (Group chat continuous messages ke liye) */}
      {!showAvatar && !isOwn && <div className="w-8" />}
      
      <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        {/* Name sirf tab dikhayein jab pehla message ho */}
        {!isOwn && showAvatar && (
          <button 
            onClick={handleAvatarClick}
            className="text-xs text-muted-foreground font-bold px-1 hover:text-foreground transition-colors cursor-pointer ml-1"
          >
            {sender.name}
          </button>
        )}
        
        <div
          className={cn(
            'rounded-2xl overflow-hidden shadow-sm relative group',
            message.type === 'text' && 'px-4 py-2.5',
            message.type === 'code' && 'min-w-[280px]',
            message.type === 'image' && 'p-1 bg-transparent shadow-none', // Image ke liye padding hata di
            
            // ✅ Standard Tailwind Colors (Safe Fallback)
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-secondary text-secondary-foreground rounded-bl-sm'
          )}
        >
          {renderContent()}
        </div>
        
        <span className={cn("text-[10px] text-muted-foreground px-1 select-none", isOwn ? "text-right" : "text-left")}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
};