import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, Users, PhoneOff, Loader2 } from 'lucide-react';
import axios from 'axios';

// Utils
import { User } from '@/types/chat';

const SOCKET_URL = 'https://opentalks.onrender.com';

const LivePage = () => {
  const { roomId } = useParams(); // URL se Room ID milega
  const [searchParams] = useSearchParams();
  const isHost = searchParams.get('role') === 'host'; // URL se Role pata chalega

  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [viewers, setViewers] = useState<number>(0);
  const [status, setStatus] = useState("Initializing...");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const iceQueue = useRef<{ [key: string]: RTCIceCandidate[] }>({});

  // 1. Fetch User & Connect Socket
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) return window.location.href = '/';

      try {
        // Fetch current user details
        const { data } = await axios.get(`${SOCKET_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUser(data);

        // Connect Socket
        const newSocket = io(SOCKET_URL, { 
            auth: { token },
            query: { userId: data._id } 
        });
        setSocket(newSocket);

      } catch (e) {
        console.error("Auth Failed", e);
      }
    };
    init();
  }, []);

  // 2. Start Streaming Logic (Jab Socket & User ready ho)
  useEffect(() => {
    if (!socket || !user || !roomId) return;

    const startSession = async () => {
      try {
        if (isHost) {
          setStatus("Setting up camera...");
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;

          socket.emit("start-live", { 
            roomId, 
            title: `${user.name}'s Stream`, 
            user 
          });
          setStatus("Live");
        } else {
          setStatus("Connecting to Host...");
          socket.emit("join-live", { roomId, user });
        }
      } catch (err) {
        alert("Camera permission required!");
      }
    };

    startSession();

    // --- SOCKET EVENTS ---
    
    socket.on("update-live-sessions", (sessions: any[]) => {
        const session = sessions.find(s => s.roomId === roomId);
        if (session?.viewers) setViewers(session.viewers.length);
    });

    socket.on("viewer-joined", async ({ viewerId }) => {
        if (!isHost || !streamRef.current) return;
        const peer = createPeer(viewerId, socket);
        peersRef.current[viewerId] = peer;
        streamRef.current.getTracks().forEach(track => peer.addTrack(track, streamRef.current!));
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("live-offer", { offer, viewerId });
    });

    socket.on("live-offer", async ({ offer, hostId }) => {
        if (isHost) return;
        setStatus("Receiving Stream...");
        const peer = createPeer(hostId, socket);
        peersRef.current[hostId] = peer;
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
        await peer.setLocalDescription(answer);
        socket.emit("live-answer", { answer, hostId });
        
        if (iceQueue.current[hostId]) {
            iceQueue.current[hostId].forEach(c => peer.addIceCandidate(c).catch(console.error));
            delete iceQueue.current[hostId];
        }
    });

    socket.on("live-answer", async ({ answer, viewerId }) => {
        const peer = peersRef.current[viewerId];
        if (peer) await peer.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("live-ice-candidate", async ({ candidate, senderId }) => {
        const peer = peersRef.current[senderId];
        if (peer) {
            if (peer.remoteDescription) await peer.addIceCandidate(new RTCIceCandidate(candidate));
            else {
                if (!iceQueue.current[senderId]) iceQueue.current[senderId] = [];
                iceQueue.current[senderId].push(new RTCIceCandidate(candidate));
            }
        }
    });

    socket.on("live-ended", () => {
        alert("Stream Ended");
        window.close();
    });

    return () => { socket.disconnect(); };
  }, [socket, user, roomId]);

  const createPeer = (targetId: string, socket: Socket) => {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peer.onicecandidate = (e) => e.candidate && socket.emit("live-ice-candidate", { candidate: e.candidate, targetId });
    peer.ontrack = (e) => {
        if (!isHost && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0];
            remoteVideoRef.current.play();
        }
    };
    return peer;
  };

  const handleLeave = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (isHost && socket) socket.emit("end-live", roomId);
    window.close(); // Close Tab
  };

  const toggleMic = () => {
     if(streamRef.current) {
         streamRef.current.getAudioTracks().forEach(t => t.enabled = !micOn);
         setMicOn(!micOn);
     }
  };

  const toggleCam = () => {
     if(streamRef.current) {
         streamRef.current.getVideoTracks().forEach(t => t.enabled = !cameraOn);
         setCameraOn(!cameraOn);
     }
  };

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-3">
                <div className="bg-red-600 px-3 py-1 rounded text-white font-bold text-xs animate-pulse">LIVE</div>
                <span className="text-white font-medium text-sm">{status}</span>
            </div>
            <div className="bg-black/40 px-3 py-1.5 rounded-full text-white flex items-center gap-2 border border-white/10">
                <Users size={14} /> <span className="text-sm font-bold">{viewers}</span>
            </div>
        </div>

        {/* Video Area */}
        <div className="w-full h-full flex items-center justify-center">
            {isHost ? (
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
            ) : (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 flex gap-4">
            {isHost && (
                <>
                    <button onClick={toggleMic} className={`p-4 rounded-full ${micOn ? 'bg-zinc-800' : 'bg-red-500'} text-white border border-white/10`}>
                        {micOn ? <Mic /> : <MicOff />}
                    </button>
                    <button onClick={toggleCam} className={`p-4 rounded-full ${cameraOn ? 'bg-zinc-800' : 'bg-red-500'} text-white border border-white/10`}>
                        {cameraOn ? <Video /> : <VideoOff />}
                    </button>
                </>
            )}
            <button onClick={handleLeave} className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                <PhoneOff size={20} /> {isHost ? 'End Stream' : 'Leave'}
            </button>
        </div>
    </div>
  );
};

export default LivePage;