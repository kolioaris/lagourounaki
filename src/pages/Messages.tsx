import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sidebar } from '../components/Sidebar';
import { Messages as MessagesComponent } from '../components/Messages';
import { UserCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

export function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentMessages, setRecentMessages] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        fetchConversations(user.id);
        fetchRecentMessages(user.id);
      }
    };
    getUser();
  }, []);

  const fetchRecentMessages = async (userId: string) => {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, name, email),
        receiver:receiver_id(id, name, email)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const uniqueConversations = [];
      const seen = new Set();

      data.forEach(message => {
        const otherUser = message.sender_id === userId ? message.receiver : message.sender;
        if (!seen.has(otherUser.id)) {
          seen.add(otherUser.id);
          uniqueConversations.push({
            user: otherUser,
            lastMessage: message
          });
        }
      });

      setRecentMessages(uniqueConversations);
    }
  };

  const fetchConversations = async (userId: string) => {
    const { data: mutualFollowers } = await supabase.rpc('get_mutual_followers', {
      user_id: userId
    });

    if (mutualFollowers) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', mutualFollowers);

      setConversations(profiles || []);
      setFilteredConversations(profiles || []);
    }
  };

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = conversations.filter(user => 
        (user.name || user.email).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchTerm, conversations]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 bg-gray-800 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Messages</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4 h-[calc(100vh-12rem)] flex flex-col">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {recentMessages.length > 0 && !searchTerm && (
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-gray-400 mb-2">Recent Messages</h2>
                    {recentMessages.map(({ user, lastMessage }) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          selectedUser?.id === user.id
                            ? 'bg-primary-500/20'
                            : 'hover:bg-gray-600'
                        }`}
                      >
                        <UserCircle size={40} className="text-primary-300" />
                        <div className="text-left flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {user.name || user.email}
                          </h3>
                          <p className="text-sm text-gray-400 truncate">
                            {lastMessage.content}
                          </p>
                          <span className="text-xs text-gray-500">
                            {format(new Date(lastMessage.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </button>
                    ))}
                    <div className="border-b border-gray-600 my-4"></div>
                  </div>
                )}

                <div>
                  <h2 className="text-sm font-semibold text-gray-400 mb-2">All Friends</h2>
                  {filteredConversations.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedUser?.id === user.id
                          ? 'bg-primary-500/20'
                          : 'hover:bg-gray-600'
                      }`}
                    >
                      <UserCircle size={40} className="text-primary-300" />
                      <div className="text-left">
                        <h3 className="font-semibold">{user.name || user.email}</h3>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-gray-700 rounded-lg">
              {selectedUser ? (
                <MessagesComponent
                  friendId={selectedUser.id}
                  onClose={() => setSelectedUser(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}