import { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer'; 
import { User } from '@/types/chat';
import { Avatar } from '../chat/Avatar';
import { io, Socket } from 'socket.io-client'; 
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor,
  Maximize2, MoreVertical, // Removed unused SwitchCamera, Minimize2, Users, MessageSquare, Settings if not used in JSX
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const SOCKET_URL = 'http://localhost:5000'; 

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: User;      
  currentUser: User;      
  isVideoCall: boolean;
  socket: any;            
  isIncomingCall?: boolean; 
  callerSignal?: any;     
}

export const VideoCallModal = ({
  isOpen,
  onClose,
  participant,
  currentUser,
  isVideoCall,
  socket,
  isIncomingCall = false,
  callerSignal = null
}: VideoCallModalProps) => {
  
  // States
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00');
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  // Refs
  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<Peer.Instance | null>(null);

  // 1. Timer Logic
  useEffect(() => {
    if (!callAccepted) return;
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      setCallDuration(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [callAccepted]);

  // 2. Setup Media & Socket Listeners
  useEffect(() => {
    if (!isOpen) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        // Agar Outgoing Call hai, toh Call Initiate karo
        if (!isIncomingCall) {
            callUser(currentStream);
        }
      })
      .catch(err => console.error("Failed to get stream:", err));

    // Handle Call Ended by remote user
    socket.on("endCall", () => {
        leaveCall();
    });

    return () => {
        socket.off("endCall");
    };
  }, [isOpen]);

  // 3. Initiate Call (Caller Side)
  const callUser = (currentStream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: currentStream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: participant._id, 
        signalData: data,
        from: currentUser._id,
        name: currentUser.name,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  // 4. Answer Call (Receiver Side)
  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream!,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: participant._id });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    if (callerSignal) {
        peer.signal(callerSignal);
    }
    
    connectionRef.current = peer;
  };

  useEffect(() => {
     if(isIncomingCall && stream && callerSignal && !callAccepted) {
         answerCall();
     }
  }, [isIncomingCall, stream, callerSignal]);

  // 5. Handle Mute/Video Toggle
  const toggleMute = () => {
      if(stream) {
          stream.getAudioTracks()[0].enabled = isMuted; 
          setIsMuted(!isMuted);
      }
  }

  const toggleVideo = () => {
      if(stream) {
          stream.getVideoTracks()[0].enabled = isVideoEnabled; 
          setIsVideoEnabled(!isVideoEnabled);
      }
  }

  // 6. End Call
  const leaveCall = () => {
    setCallEnded(true);
    
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    
    if(stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    socket.emit("endCall", { to: participant._id });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={leaveCall}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 bg-[#1a1a2e] border-none overflow-hidden">
        <div className="relative w-full h-full flex flex-col">
          
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar user={participant} size="md" />
              <div>
                <h3 className="font-semibold text-white">{participant.name}</h3>
                <p className="text-sm text-white/70">{callAccepted ? callDuration : 'Calling...'}</p>
              </div>
            </div>
             <div className="flex items-center gap-2">
                 <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"><Maximize2 className="h-5 w-5"/></button>
             </div>
          </div>

          {/* === REMOTE VIDEO (LARGE) === */}
          {/* Samne wale ki video un-mirrored rehni chahiye taaki text seedha padhne mein aaye */}
          <div className="flex-1 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center overflow-hidden relative">
            {callAccepted && !callEnded ? (
                <video 
                    playsInline 
                    ref={userVideo} 
                    autoPlay 
                    className="w-full h-full object-cover" 
                />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="text-center z-10">
                  <Avatar user={participant} size="xl" />
                  <p className="mt-4 text-white/60 text-lg">{participant.name}</p>
                  <p className="text-white/40 text-sm">Connecting...</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
                </div>
              </div>
            )}
          </div>

          {/* === SELF VIEW (SMALL) === */}
          {/* YAHAN FIX HAI: 'scale-x-[-1]' lagaya gaya hai taaki aapse khud ko aaine (mirror) ki tarah dekh sako */}
          <div className="absolute bottom-24 right-6 w-40 h-28 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-[#1a1a2e] z-30">
            {stream && (
                <video 
                    playsInline 
                    muted 
                    ref={myVideo} 
                    autoPlay 
                    className={`w-full h-full object-cover scale-x-[-1] ${!isVideoEnabled ? 'hidden' : ''}`}
                />
            )}
            
            {!isVideoEnabled && (
                <div className="w-full h-full flex items-center justify-center bg-[#2d2d44]">
                  <VideoOff className="h-6 w-6 text-white/40" />
                </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-6 py-6">
            <div className="flex items-center justify-center gap-4">
              
              <button onClick={toggleMute} className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}>
                {isMuted ? <MicOff className="h-6 w-6 text-white"/> : <Mic className="h-6 w-6 text-white"/>}
              </button>

              <button onClick={toggleVideo} className={`p-4 rounded-full transition-all ${!isVideoEnabled ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}>
                {!isVideoEnabled ? <VideoOff className="h-6 w-6 text-white"/> : <Video className="h-6 w-6 text-white"/>}
              </button>

              <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white">
                <Monitor className="h-6 w-6" />
              </button>

              <button onClick={leaveCall} className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white ml-4">
                <PhoneOff className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};