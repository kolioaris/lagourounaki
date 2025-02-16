export class WebRTCConnection {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStream: (stream: MediaStream) => void;
  private onConnectionStateChange: (state: RTCPeerConnectionState) => void;

  constructor(
    onRemoteStream: (stream: MediaStream) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void
  ) {
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;

    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ]
    });

    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      this.remoteStream = stream;
      this.onRemoteStream(stream);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the ICE candidate to the remote peer
        // This would be implemented through your signaling server
        console.log('New ICE candidate:', event.candidate);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.onConnectionStateChange(this.peerConnection.connectionState);
    };
  }

  async setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    stream.getTracks().forEach(track => {
      if (this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  close() {
    this.peerConnection.close();
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
  }
}