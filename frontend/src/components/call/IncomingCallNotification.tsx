import { User } from '@/types/chat';
import { Avatar } from '../chat/Avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallNotificationProps {
  caller: User;
  isVideoCall: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallNotification = ({
  caller,
  isVideoCall,
  onAccept,
  onReject,
}: IncomingCallNotificationProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-80 rounded-3xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-8 shadow-2xl border border-white/10">
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-40 h-40 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute w-52 h-52 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          <div className="absolute w-64 h-64 rounded-full border border-primary/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Caller avatar with glow */}
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
            <Avatar user={caller} size="xl" showStatus={false} />
          </div>

          {/* Caller info */}
          <h3 className="text-xl font-semibold text-white mb-1">{caller.name}</h3>
          <p className="text-white/60 text-sm mb-2">
            {isVideoCall ? 'Incoming Video Call' : 'Incoming Audio Call'}
          </p>

          {/* Call type indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 mb-8">
            {isVideoCall ? (
              <Video className="h-4 w-4 text-primary" />
            ) : (
              <Phone className="h-4 w-4 text-primary" />
            )}
            <span className="text-white/80 text-sm">
              {isVideoCall ? 'Video Call' : 'Voice Call'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-6">
            {/* Reject button */}
            <button
              onClick={onReject}
              className="group flex flex-col items-center gap-2"
            >
              <div className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 group-hover:scale-110 shadow-lg shadow-red-500/30">
                <PhoneOff className="h-6 w-6" />
              </div>
              <span className="text-white/60 text-xs">Decline</span>
            </button>

            {/* Accept button */}
            <button
              onClick={onAccept}
              className="group flex flex-col items-center gap-2"
            >
              <div className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all duration-200 group-hover:scale-110 shadow-lg shadow-green-500/30 animate-pulse">
                {isVideoCall ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <Phone className="h-6 w-6" />
                )}
              </div>
              <span className="text-white/60 text-xs">Accept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
