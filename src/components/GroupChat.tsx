import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Send, X, Settings, UserPlus } from 'lucide-react';
import { GroupChatSettings } from './GroupChatSettings';
import { AddGroupMember } from './AddGroupMember';

interface GroupChatProps {
  groupId: string;
  onClose: () => void;
}

export function GroupChat({ groupId, onClose }: GroupChatProps) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [group, setGroup] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchGroup = async () => {
      const { data } = await supabase
        .from('group_chats')
        .select('*')
        .eq('id', groupId)
        .single();

      setGroup(data);
    };

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('group_chat_messages')
        .select(`
          *,
          user:user_id (
            id,
            email,
            name
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    };

    fetchGroup();
    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('group_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const { data: message } = await supabase
      .from('group_chat_messages')
      .insert({
        group_id: groupId,
        user_id: currentUser.id,
        content: newMessage
      })
      .select(`
        *,
        user:user_id (
          id,
          email,
          name
        )
      `)
      .single();

    if (message) {
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  return (
    <>
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col relative">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {group?.icon_url && (
              <img
                src={group.icon_url}
                alt={group.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <h2 className="text-xl font-bold">{group?.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddMember(true)}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Add member"
            >
              <UserPlus size={20} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Group settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.user_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.user_id === currentUser?.id
                    ? 'bg-primary-500'
                    : 'bg-gray-700'
                }`}
              >
                {message.user_id !== currentUser?.id && (
                  <p className="text-sm text-gray-400 mb-1">
                    {message.user.name || message.user.email}
                  </p>
                )}
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

      {showSettings && (
        <GroupChatSettings
          group={group}
          onClose={() => setShowSettings(false)}
          onUpdate={(updatedGroup) => {
            setGroup(updatedGroup);
            setShowSettings(false);
          }}
        />
      )}

      {showAddMember && (
        <AddGroupMember
          groupId={groupId}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </>
  );
}