import { useEffect, useState } from 'react';
import { Radio, Users, Play, Loader2 } from 'lucide-react';
import { User } from '@/types/chat';
import { Avatar } from '@/components/chat/Avatar';
import { Socket } from 'socket.io-client';

interface LiveSession {
  id: string;
  title: string;
  host: User;
  participants: number;
  isLive: boolean;
}

interface LiveSectionProps {
  currentUser: User;
  socket: Socket | null;
  onStartLive: () => void;
  onJoinLive: (session: LiveSession) => void;
}

export const LiveSection = ({ currentUser, socket, onStartLive, onJoinLive }: LiveSectionProps) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    // Function to handle incoming session list
    const handleSessionUpdate = (data: any[]) => {
      console.log("🔴 Live Sessions Updated:", data);
      
      const formatted: LiveSession[] = data.map(s => ({
         id: s.roomId, // Ensure Backend sends 'roomId'
         title: s.title || "Live Stream",
         host: s.hostData, // Ensure Backend sends full host object
         participants: s.viewers ? s.viewers.length : 0,
         isLive: true
      }));
      
      setSessions(formatted);
      setLoading(false);
    };

    // 1. Initial Fetch
    socket.emit("get-active-sessions");

    // 2. Listen for Real-time Updates (Broadcasts)
    socket.on('update-live-sessions', handleSessionUpdate);

    return () => { 
        socket.off('update-live-sessions', handleSessionUpdate); 
    };
  }, [socket]);

  return (
    <div className="flex flex-col h-full bg-card/30">
      {/* Start Button */}
      <div className="p-4 border-b border-border/50">
        <button 
          onClick={onStartLive} 
          className="w-full group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] transition-all duration-200 active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Radio className="h-5 w-5 animate-pulse" />
          <span>Go Live Now</span>
        </button>
      </div>

      {/* List Header */}
      <div className="px-4 py-3 flex justify-between items-end border-b border-border/30 bg-secondary/10">
         <h3 className="font-bold text-sm text-foreground/80 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            Active Streams
         </h3>
         {sessions.length > 0 && (
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {sessions.length} LIVE
            </span>
         )}
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-60">
                <Loader2 className="animate-spin text-primary" />
                <span className="text-xs">Finding streams...</span>
            </div>
        ) : (
            <>
            {sessions.map((session) => (
                <div key={session.id} className="group relative overflow-hidden p-3 rounded-2xl bg-secondary/40 border border-border hover:border-red-500/30 hover:bg-secondary/60 transition-all duration-300 shadow-sm hover:shadow-md">
                
                {/* Session Info */}
                <div className="flex items-start gap-3 mb-3 relative z-10">
                    <div className="relative">
                        <Avatar user={session.host} size="md" className="border-2 border-background" />
                        <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border-2 border-background flex items-center gap-0.5">
                            <Radio size={8} /> LIVE
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate pr-2 group-hover:text-red-500 transition-colors">
                            {session.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            Hosted by <span className="font-medium text-foreground/80">{session.host.name}</span>
                        </p>
                    </div>
                </div>
                
                {/* Actions & Stats */}
                <div className="flex items-center justify-between mt-2 relative z-10">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/60 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                        <Users size={12} className="text-primary" /> 
                        <span>{session.participants} watching</span>
                    </div>
                    
                    {session.host._id !== currentUser._id ? (
                        <button 
                            onClick={() => onJoinLive(session)} 
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-95"
                        >
                            <Play size={10} fill="currentColor" /> Watch
                        </button>
                    ) : (
                        <span className="text-[10px] text-red-500 font-black tracking-wider border border-red-500/20 px-3 py-1 rounded-lg bg-red-500/5">
                            YOUR STREAM
                        </span>
                    )}
                </div>

                {/* Subtle Background Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
            ))}

            {sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-60 mt-10">
                    <div className="bg-secondary/80 p-5 rounded-full ring-4 ring-secondary/30">
                        <Radio className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">No active streams</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[180px] mx-auto leading-relaxed">
                            Start a session to connect with your friends instantly!
                        </p>
                    </div>
                </div>
            )}
            </>
        )}
      </div>
    </div>
  );
};