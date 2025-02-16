import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Send, X, Phone, Video } from 'lucide-react';
import { Call } from './Call';

interface MessagesProps {
  friendId: string;
  onClose: () => void;
}

export function Messages({ friendId, onClose }: MessagesProps) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchFriend = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', friendId)
        .single();

      setFriend(data);
    };

    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    };

    fetchFriend();
    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${friendId},receiver_id=eq.${friendId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: message } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: newMessage
      })
      .select()
      .single();

    if (message) {
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const startCall = (type: 'voice' | 'video') => {
    setCallType(type);
    setIsInCall(true);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      {isInCall && callType ? (
        <Call
          friendId={friendId}
          type={callType}
          onClose={() => {
            setIsInCall(false);
            setCallType(null);
          }}
        />
      ) : (
        <div className="bg-gray-800 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col relative">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">
                {friend?.name || friend?.email || 'Chat'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startCall('voice')}
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                  title="Start voice call"
                >
                  <Phone size={20} />
                </button>
                <button
                  onClick={() => startCall('video')}
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                  title="Start video call"
                >
                  <Video size={20} />
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === friendId ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.sender_id === friendId
                      ? 'bg-gray-700'
                      : 'bg-primary-500'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}