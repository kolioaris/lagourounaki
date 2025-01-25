import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, Copy, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShareModalProps {
  postId: string;
  onClose: () => void;
}

export function ShareModal({ postId, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWithFriend = async (friendId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('post_shares')
      .insert({
        post_id: postId,
        user_id: user.id,
        shared_with_id: friendId
      });

    onClose();
  };

  useState(() => {
    const fetchFriends = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mutualFollowers } = await supabase.rpc('get_mutual_followers', {
        user_id: user.id
      });

      if (mutualFollowers) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', mutualFollowers);

        setFriends(profiles || []);
      }

      setLoading(false);
    };

    fetchFriends();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Share Post</h2>

        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors mb-6"
        >
          {copied ? (
            <span className="text-green-500">Copied!</span>
          ) : (
            <>
              <Link size={20} />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Share with Friends</h3>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : friends.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No friends to share with</p>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => handleShareWithFriend(friend.id)}
                className="w-full flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <span>{friend.name || friend.email}</span>
                <Send size={18} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}