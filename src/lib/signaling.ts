import { supabase } from './supabase';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  sender: string;
  receiver: string;
  payload: any;
}

export class SignalingChannel {
  private channelName: string;
  private onMessage: (message: SignalingMessage) => void;

  constructor(channelName: string, onMessage: (message: SignalingMessage) => void) {
    this.channelName = channelName;
    this.onMessage = onMessage;

    this.subscribe();
  }

  private subscribe() {
    supabase
      .channel(this.channelName)
      .on('broadcast', { event: 'signaling' }, ({ payload }) => {
        this.onMessage(payload as SignalingMessage);
      })
      .subscribe();
  }

  async send(message: SignalingMessage) {
    await supabase
      .channel(this.channelName)
      .send({
        type: 'broadcast',
        event: 'signaling',
        payload: message
      });
  }

  close() {
    supabase.removeChannel(supabase.channel(this.channelName));
  }
}