import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Post } from '../components/Post';
import { Sidebar } from '../components/Sidebar';
import { UserCircle, Calendar, Mail, Edit2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { EditProfileModal } from '../components/EditProfileModal';
import { FollowList } from '../components/FollowList';
import { Messages } from '../components/Messages';
import { Badge } from '../components/Badge';
import { BlockButton } from '../components/BlockButton';
import { ReportButton } from '../components/ReportButton';

interface ProfileProps {
  user: {
    name?: string;
    email: string;
    avatar_url?: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function Profile() {
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 bg-gray-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-700 rounded-lg shadow-xl p-8 mb-8">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                  </div>
                  <div className="flex gap-2">
                    {!isOwnProfile && (
                      <>
                        <button
                          onClick={handleFollow}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            isFollowing
                              ? 'bg-gray-600 text-white hover:bg-gray-500'
                              : 'bg-primary-500 text-white hover:bg-primary-600'
                          }`}
                        >
                          {isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                        {isMutualFollower && (
                          <button
                            onClick={() => setShowMessages(true)}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                          >
                            Message
                          </button>
                        )}
                        <BlockButton userId={userId} />
                        <ReportButton type="profile" targetId={userId} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}