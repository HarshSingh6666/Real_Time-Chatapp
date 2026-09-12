import { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Video, VideoOff, Users, Loader2 } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { User } from '@/types/chat';

interface LiveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket;
  currentUser: User;
  isHost: boolean;
  roomId: string;
  sessionTitle?: string;
}

export const LiveSessionModal = ({ 
  isOpen, onClose, socket, currentUser, isHost, roomId, sessionTitle 
}: LiveSessionModalProps) => {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [viewers, setViewers] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [debugMsg, setDebugMsg] = useState("Initializing...");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const iceCandidatesQueue = useRef<{ [key: string]: RTCIceCandidate[] }>({});

  useEffect(() => {
    if (!isOpen) return;
    setIsConnecting(true);

    const startStream = async () => {
      try {
        if (isHost) {
          setDebugMsg("Starting Camera...");
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          
          socket.emit("start-live", { roomId, title: sessionTitle || "Live Stream", user: currentUser });
          setIsConnecting(false);
          setDebugMsg("Live now");
        } else {
          setDebugMsg("Joining Room...");
          socket.emit("join-live", { roomId, user: currentUser });
        }
      } catch (err) {
        console.error("❌ Media Error:", err);
        alert("Camera/Mic access failed!");
        onClose();
      }
    };

    startStream();

    // ================= SOCKET LISTENERS =================

    socket.on("update-live-sessions", (sessions: any[]) => {
        const currentSession = sessions.find(s => (s.roomId === roomId) || (s.hostId === roomId));
        if (currentSession && currentSession.viewers) {
            setViewers(currentSession.viewers.length);
        }
    });

    // 1. HOST: Viewer Joined -> Send Offer
    socket.on("viewer-joined", async ({ viewerId }) => {
      if (!isHost || !streamRef.current) return;
      console.log(`👤 Viewer Joined: ${viewerId}`);

      const peer = createPeer(viewerId);
      peersRef.current[viewerId] = peer;

      // Add Tracks
      streamRef.current.getTracks().forEach(track => peer.addTrack(track, streamRef.current!));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      
      console.log("📤 Sending Offer");
      socket.emit("live-offer", { offer, viewerId });
    });

    // 2. VIEWER: Receive Offer -> Send Answer
    socket.on("live-offer", async ({ offer, hostId }) => {
      if (isHost) return;
      console.log("📩 Received Offer");
      setDebugMsg("Connecting...");

      const peer = createPeer(hostId);
      peersRef.current[hostId] = peer;

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      
      // 🔥 FIX: Force receive video/audio
      const answer = await peer.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
      });
      
      await peer.setLocalDescription(answer);
      
      console.log("📤 Sending Answer");
      socket.emit("live-answer", { answer, hostId });

      // Process Queued ICE Candidates
      if (iceCandidatesQueue.current[hostId]) {
          iceCandidatesQueue.current[hostId].forEach(candidate => {
              peer.addIceCandidate(candidate).catch(e => console.error("ICE Queue Error", e));
          });
          delete iceCandidatesQueue.current[hostId];
      }
    });

    // 3. HOST: Receive Answer
    socket.on("live-answer", async ({ answer, viewerId }) => {
      console.log("📩 Received Answer");
      const peer = peersRef.current[viewerId];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // 4. ICE Candidates
    socket.on("live-ice-candidate", async ({ candidate, senderId }) => {
      const peer = peersRef.current[senderId];
      if (peer) {
        if (peer.remoteDescription) {
            await peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
        } else {
            // Queue if remote description not set yet
            if (!iceCandidatesQueue.current[senderId]) iceCandidatesQueue.current[senderId] = [];
            iceCandidatesQueue.current[senderId].push(new RTCIceCandidate(candidate));
        }
      }
    });

    socket.on("live-ended", () => {
      alert("Stream ended.");
      handleClose();
    });

    return () => {
      socket.off("update-live-sessions");
      socket.off("viewer-joined");
      socket.off("live-offer");
      socket.off("live-answer");
      socket.off("live-ice-candidate");
      socket.off("live-ended");
    };
  }, [isOpen]);

  // --- HELPER: Create Peer ---
  const createPeer = (targetId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" }
      ]
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("live-ice-candidate", { candidate: event.candidate, targetId });
      }
    };

    // 🔥 TRACK EVENT (Video Received)
    peer.ontrack = (event) => {
      console.log("📺 Stream Track Received!", event.streams[0]);
      setIsConnecting(false); // Stop Loader
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.onloadedmetadata = () => {
            remoteVideoRef.current?.play().catch(e => console.error("Autoplay prevented:", e));
        };
      }
    };

    return peer;
  };

  const handleClose = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
    if (isHost) socket.emit("end-live", roomId);
    onClose();
  };

  // Toggle Controls
  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = !micOn);
      setMicOn(!micOn);
    }
  };
  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => t.enabled = !cameraOn);
      setCameraOn(!cameraOn);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-6xl bg-zinc-900 flex items-center justify-center overflow-hidden shadow-2xl">
        
        {isHost ? (
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
        ) : (
          <>
            {isConnecting && (
                <div className="absolute z-10 flex flex-col items-center text-white bg-black/60 p-6 rounded-xl backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-500" />
                    <p className="font-bold text-lg">Connecting...</p>
                    <p className="text-xs text-zinc-400 mt-2 font-mono">{debugMsg}</p>
                </div>
            )}
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          </>
        )}

        {/* UI Overlay */}
        <div className="absolute top-6 left-6 flex gap-3">
             <div className="bg-red-600 px-3 py-1 rounded-md text-white flex items-center gap-2 shadow-lg animate-pulse">
                <span className="font-bold text-xs tracking-wider">LIVE</span>
            </div>
            {!isHost && <div className="bg-black/50 px-3 py-1 rounded-md text-white text-xs border border-white/10">Watching Host</div>}
        </div>

        <div className="absolute top-6 right-6 flex items-center gap-3">
             <div className="bg-black/50 px-3 py-1.5 rounded-full text-white flex items-center gap-2 border border-white/10">
                <Users size={14} className="text-zinc-400" />
                <span className="text-sm font-bold">{viewers}</span>
            </div>
            <button onClick={handleClose} className="p-2 bg-black/50 hover:bg-red-600/80 rounded-full text-white border border-white/10"><X size={20} /></button>
        </div>

        {/* Host Controls */}
        {isHost && (
            <div className="absolute bottom-8 flex items-center gap-6 bg-black/40 p-4 rounded-3xl backdrop-blur-xl border border-white/10">
                <button onClick={toggleMic} className={`p-4 rounded-full ${micOn ? 'bg-zinc-800' : 'bg-red-500 text-white'}`}>{micOn ? <Mic size={24} /> : <MicOff size={24} />}</button>
                <button onClick={toggleCam} className={`p-4 rounded-full ${cameraOn ? 'bg-zinc-800' : 'bg-red-500 text-white'}`}>{cameraOn ? <Video size={24} /> : <VideoOff size={24} />}</button>
                <button onClick={handleClose} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold">End Stream</button>
            </div>
        )}
        
        {!isHost && (
             <div className="absolute bottom-8">
                <button onClick={handleClose} className="bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-xl">Leave Stream</button>
             </div>
        )}
      </div>
    </div>
  );
};