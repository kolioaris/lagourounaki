import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, UserPlus, X } from 'lucide-react';

interface AddGroupMemberProps {
  groupId: string;
  onClose: () => void;
}

export function AddGroupMember({ groupId, onClose }: AddGroupMemberProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentMembers, setCurrentMembers] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();

    // Fetch current members
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('group_chat_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (data) {
        setCurrentMembers(new Set(data.map(member => member.user_id)));
      }
    };
    fetchMembers();
  }, [groupId]);

  const searchUsers = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const { data: mutualFollowers } = await supabase.rpc('get_mutual_followers', {
      user_id: currentUser?.id
    });

    if (mutualFollowers) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', mutualFollowers)
        .not('id', 'in', `(${Array.from(currentMembers).join(',')})`)
        .ilike('email', `%${term}%`);

      setSearchResults(data || []);
    }
  };

  const addMember = async (userId: string) => {
    const { error } = await supabase
      .from('group_chat_members')
      .insert({
        group_id: groupId,
        user_id: userId
      });

    if (!error) {
      setCurrentMembers(prev => new Set([...prev, userId]));
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Add Group Members</h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchUsers(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="space-y-2">
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
            >
              <span>{user.name || user.email}</span>
              <button
                onClick={() => addMember(user.id)}
                className="p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors"
              >
                <UserPlus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}