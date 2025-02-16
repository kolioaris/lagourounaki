import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ban } from 'lucide-react';

interface BlockButtonProps {
  userId: string;
  onBlock?: () => void;
}

export function BlockButton({ userId, onBlock }: BlockButtonProps) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        checkIfBlocked(user.id);
      }
    };
    getUser();
  }, []);

  const checkIfBlocked = async (currentUserId: string) => {
    const { data } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', userId)
      .single();
    
    setIsBlocked(!!data);
  };

  const handleBlock = async () => {
    if (!currentUser) return;

    if (isBlocked) {
      await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', currentUser.id)
        .eq('blocked_id', userId);
      
      setIsBlocked(false);
    } else {
      await supabase
        .from('blocked_users')
        .insert({
          blocker_id: currentUser.id,
          blocked_id: userId
        });
      
      setIsBlocked(true);
      if (onBlock) onBlock();
    }
  };

  if (currentUser?.id === userId) return null;

  return (
    <button
      onClick={handleBlock}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isBlocked
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white'
      }`}
    >
      <Ban size={18} />
      {isBlocked ? 'Unblock' : 'Block'}
    </button>
  );
}