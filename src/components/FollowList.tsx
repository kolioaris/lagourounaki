import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { UserCircle, X } from 'lucide-react';

interface FollowListProps {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

export function FollowList({ userId, type, onClose }: FollowListProps) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('followers')
        .select(`
          profiles!followers_${type === 'followers' ? 'follower' : 'following'}_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq(type === 'followers' ? 'following_id' : 'follower_id', userId);

      setUsers(data?.map(item => item.profiles) || []);
      setLoading(false);
    };

    fetchUsers();
  }, [userId, type]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 capitalize">{type}</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-400">No {type} yet</p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.id}`}
                className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                onClick={onClose}
              >
                <UserCircle size={40} className="text-primary-300" />
                <div>
                  <h3 className="font-semibold">{user.name || user.email}</h3>
                  {user.name && <p className="text-sm text-gray-400">{user.email}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}