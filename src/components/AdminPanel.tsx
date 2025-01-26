import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, UserPlus, X } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [adminTeam, setAdminTeam] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        fetchAdminTeam();
      }
    };
    getUser();
  }, []);

  const fetchAdminTeam = async () => {
    const { data } = await supabase
      .from('admin_team')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    setAdminTeam(data || []);
    setIsLoading(false);
  };

  const searchUsers = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', `%${term}%`)
      .limit(5);

    // Filter out existing admin team members
    const existingAdminIds = adminTeam.map(admin => admin.user_id);
    const filteredResults = data?.filter(user => !existingAdminIds.includes(user.id)) || [];

    setSearchResults(filteredResults);
  };

  const addAdmin = async (userId: string, role: 'admin' | 'moderator' | 'developer') => {
    const { data, error } = await supabase
      .from('admin_team')
      .insert({
        user_id: userId,
        role
      })
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          email
        )
      `)
      .single();

    if (!error && data) {
      setAdminTeam([...adminTeam, data]);
      setSearchResults([]);
      setSearchTerm('');
    }
  };

  const removeAdmin = async (userId: string) => {
    await supabase
      .from('admin_team')
      .delete()
      .eq('user_id', userId);

    setAdminTeam(adminTeam.filter(admin => admin.user_id !== userId));
  };

  const isOwnerAdmin = adminTeam.find(
    admin => admin.user_id === currentUser?.id && admin.role === 'admin'
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Shield size={24} className="text-primary-300" />
          <h2 className="text-2xl font-bold">Admin Panel</h2>
        </div>

        {isOwnerAdmin && (
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users by email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full pl-4 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <span>{user.email}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addAdmin(user.id, 'moderator')}
                        className="px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                      >
                        Add as Moderator
                      </button>
                      <button
                        onClick={() => addAdmin(user.id, 'admin')}
                        className="px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                      >
                        Add as Admin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Admin Team</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : adminTeam.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No admin team members</p>
          ) : (
            adminTeam.map((admin) => (
              <div
                key={admin.user_id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
              >
                <div>
                  <h4 className="font-semibold">{admin.profiles.name || admin.profiles.email}</h4>
                  <p className="text-sm text-gray-400 capitalize">{admin.role}</p>
                </div>
                {isOwnerAdmin && admin.user_id !== currentUser?.id && (
                  <button
                    onClick={() => removeAdmin(admin.user_id)}
                    className="px-3 py-1 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}