import { UserCircle } from 'lucide-react';

interface ProfileProps {
  user: {
    name?: string;
    email: string;
    avatar_url?: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function Profile({ user, size = 'md' }: ProfileProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 32
  };

  const checkIfFollowing = async (currentUserId: string) => {
    try {
      const { data } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId);
      setIsFollowing(data && data.length > 0);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name || user.email}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-700 flex items-center justify-center`}>
      <UserCircle size={iconSizes[size]} className="text-gray-400" />
    </div>
  );
}