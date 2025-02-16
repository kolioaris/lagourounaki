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
import { BanNotice } from '../components/BanNotice';

export function Profile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [badges, setBadges] = useState([]);
  const [isMutualFollower, setIsMutualFollower] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        checkIfFollowing(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userData) {
        setUser(userData);
      }

      const { data: postsData } = await supabase
        .from('posts')
        .select(
          `
          *,
          user:user_id (
            id,
            email,
            name
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsData) setPosts(postsData);

      const { count: followers } = await supabase
        .from('followers')
        .select('*', { count: 'exact' })
        .eq('following_id', userId);

      const { count: following } = await supabase
        .from('followers')
        .select('*', { count: 'exact' })
        .eq('follower_id', userId);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);

      const { data: badgesData } = await supabase
        .from('user_badges')
        .select(`
          badges (
            id,
            name,
            description,
            color,
            icon
          )
        `)
        .eq('user_id', userId);

      if (badgesData) {
        setBadges(badgesData.map(item => item.badges));
      }

      setIsLoading(false);
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const checkMutualFollow = async () => {
      if (currentUser && userId) {
        const { data } = await supabase.rpc('are_mutual_followers', {
          user1_id: currentUser.id,
          user2_id: userId
        });
        setIsMutualFollower(data);
      }
    };
    checkMutualFollow();
  }, [currentUser, userId, isFollowing]);

  useEffect(() => {
    const checkBanStatus = async () => {
      const { data } = await supabase
        .from('bans')
        .select('reason')
        .eq('user_id', userId)
        .single();

      if (data) {
        setIsBanned(true);
        setBanReason(data.reason);
      }
    };

    const checkBlockStatus = async () => {
      if (!currentUser) return;

      const { data } = await supabase
        .from('blocked_users')
        .select('*')
        .or(`blocker_id.eq.${currentUser.id},blocked_id.eq.${currentUser.id}`)
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
        .single();

      setIsBlocked(!!data);
    };

    checkBanStatus();
    checkBlockStatus();
  }, [userId, currentUser]);

  const checkIfFollowing = async (currentUserId: string) => {
    const { data } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .single();
    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!currentUser) return;

    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId);
      setFollowersCount(prev => prev - 1);
    } else {
      await supabase
        .from('followers')
        .insert({
          follower_id: currentUser.id,
          following_id: userId
        });
      setFollowersCount(prev => prev + 1);
    }
    setIsFollowing(!isFollowing);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-16 bg-gray-800 p-8">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-16 bg-gray-800 p-8">
          <div className="text-center py-8">User not found</div>
        </main>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  if (isBanned) {
    return <BanNotice reason={banReason} />;
  }

  if (isBlocked) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-16 bg-gray-800 p-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold mb-4">
              {currentUser?.id === userId ? 'You have blocked this profile' : 'You are blocked by this user'}
            </h2>
            {currentUser?.id === userId && (
              <BlockButton userId={userId} onBlock={() => setIsBlocked(false)} />
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 bg-gray-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-700 rounded-lg shadow-xl p-8 mb-8">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <UserCircle size={96} className="text-primary-300" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {user.name || user.email}
                    </h1>
                    <div className="flex items-center gap-6 text-gray-400 mb-4">
                      <button
                        onClick={() => setShowFollowers(true)}
                        className="hover:text-white"
                      >
                        <span className="font-semibold">{followersCount}</span> followers
                      </button>
                      <button
                        onClick={() => setShowFollowing(true)}
                        className="hover:text-white"
                      >
                        <span className="font-semibold">{followingCount}</span> following
                      </button>
                    </div>
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
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        <Edit2 size={18} />
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-300 text-lg mb-4">{user.bio || 'No bio yet'}</p>
                
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {badges.map((badge) => (
                      <Badge key={badge.id} badge={badge} />
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-6 text-gray-400">
                  {user.show_email && (
                    <div className="flex items-center gap-2">
                      <Mail size={18} />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.show_creation_date && (
                    <div className="flex items-center gap-2">
                      <Calendar size={18} />
                      <span>Joined {format(new Date(user.created_at), 'MMMM yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Posts</h2>
            {posts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No posts yet
              </div>
            ) : (
              posts.map((post) => (
                <Post key={post.id} post={post} />
              ))
            )}
          </div>
        </div>

        {isEditing && (
          <EditProfileModal
            onClose={() => setIsEditing(false)}
            userData={user}
            onUpdate={() => {
              // Refresh user data
              const fetchUser = async () => {
                const { data } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userId)
                  .single();
                if (data) setUser(data);
              };
              fetchUser();
            }}
          />
        )}

        {showFollowers && (
          <FollowList
            userId={userId}
            type="followers"
            onClose={() => setShowFollowers(false)}
          />
        )}

        {showFollowing && (
          <FollowList
            userId={userId}
            type="following"
            onClose={() => setShowFollowing(false)}
          />
        )}

        {showMessages && (
          <Messages
            friendId={userId}
            onClose={() => setShowMessages(false)}
          />
        )}
      </main>
    </div>
  );
}