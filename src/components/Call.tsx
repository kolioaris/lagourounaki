import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { WebRTCConnection } from '../lib/webrtc';
import { SignalingChannel, SignalingMessage } from '../lib/signaling';
import { Mic, MicOff, Camera, CameraOff, Phone, Volume2, VolumeX, SwitchCamera } from 'lucide-react';

interface CallProps {
  friendId: string;
  type: 'voice' | 'video';
  onClose: () => void;
}

export function Call({ friendId, type, onClose }: CallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcRef = useRef<WebRTCConnection | null>(null);
  const signalingRef = useRef<SignalingChannel | null>(null);

  useEffect(() => {
    const setupCall = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const constraints: MediaStreamConstraints = {
          audio: true,
          video: type === 'video'
        };

        const userStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(userStream);
        setHasPermission(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userStream;
        }

        // Initialize WebRTC connection
        webrtcRef.current = new WebRTCConnection(
          (remoteStream) => {
            setRemoteStream(remoteStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          },
          (state) => setConnectionState(state)
        );

        await webrtcRef.current.setLocalStream(userStream);

        // Initialize signaling channel
        const channelName = `call-${[user.id, friendId].sort().join('-')}`;
        signalingRef.current = new SignalingChannel(channelName, async (message: SignalingMessage) => {
          if (!webrtcRef.current) return;

          // Only process messages intended for us
          if (message.receiver !== user.id) return;

          switch (message.type) {
            case 'offer':
              const answer = await webrtcRef.current.handleOffer(message.payload);
              await signalingRef.current?.send({
                type: 'answer',
                sender: user.id,
                receiver: friendId,
                payload: answer
              });
              break;

            case 'answer':
              await webrtcRef.current.handleAnswer(message.payload);
              break;

            case 'ice-candidate':
              await webrtcRef.current.handleIceCandidate(message.payload);
              break;
          }
        });

        // Log call start
        await supabase.from('call_logs').insert({
          caller_id: user.id,
          receiver_id: friendId,
          call_type: type
        });

        // Create and send offer
        const offer = await webrtcRef.current.createOffer();
        await signalingRef.current.send({
          type: 'offer',
          sender: user.id,
          receiver: friendId,
          payload: offer
        });

      } catch (err) {
        console.error('Error setting up call:', err);
        onClose();
      }
    };

    setupCall();

    return () => {
      if (signalingRef.current) {
        signalingRef.current.close();
      }
      if (webrtcRef.current) {
        webrtcRef.current.close();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [type, friendId]);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (stream && type === 'video') {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = isSpeakerOn ? 0 : 1;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const switchCamera = async () => {
    if (!stream) return;

    try {
      const currentTrack = stream.getVideoTracks()[0];
      const currentDeviceId = currentTrack.getSettings().deviceId;
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length < 2) return;

      const nextDevice = videoDevices.find(device => device.deviceId !== currentDeviceId);
      if (!nextDevice) return;

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDevice.deviceId } },
        audio: true
      });

      currentTrack.stop();
      stream.removeTrack(currentTrack);
      stream.addTrack(newStream.getVideoTracks()[0]);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Update the WebRTC connection with the new stream
      if (webrtcRef.current) {
        await webrtcRef.current.setLocalStream(stream);
      }
    } catch (err) {
      console.error('Error switching camera:', err);
    }
  };

  const handleEndCall = async () => {
    if (signalingRef.current) {
      signalingRef.current.close();
    }
    if (webrtcRef.current) {
      webrtcRef.current.close();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Update call log with end time
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: callLog } = await supabase
        .from('call_logs')
        .select('id')
        .eq('caller_id', user.id)
        .eq('receiver_id', friendId)
        .is('ended_at', null)
        .single();

      if (callLog) {
        await supabase
          .from('call_logs')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', callLog.id);
      }
    }

    onClose();
  };

  if (!hasPermission) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div className="text-center">
          <p className="text-white mb-4">Requesting camera and microphone access...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {connectionState !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center">
            <p className="text-white mb-4">Connecting to peer...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        </div>
      )}

      {type === 'video' && (
        <div className="relative flex-1">
          {/* Remote video (full screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local video (picture-in-picture) */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-32 h-48 object-cover rounded-lg border-2 border-white"
          />
        </div>
      )}

      <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full ${
            isMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {type === 'video' && (
          <>
            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full ${
                isCameraOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isCameraOff ? <CameraOff size={24} /> : <Camera size={24} />}
            </button>

            <button
              onClick={switchCamera}
              className="p-4 rounded-full bg-gray-700 hover:bg-gray-600"
            >
              <SwitchCamera size={24} />
            </button>
          </>
        )}

        <button
          onClick={toggleSpeaker}
          className={`p-4 rounded-full ${
            !isSpeakerOn ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>

        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600"
        >
          <Phone size={24} className="rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}