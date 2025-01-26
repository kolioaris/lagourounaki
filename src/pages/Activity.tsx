import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sidebar } from '../components/Sidebar';
import { Link } from 'react-router-dom';
import { UserCircle, Heart, MessageCircle, UserPlus, Shield, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { Profile } from '../components/Profile';

interface Activity {
  type: 'follow' | 'post_like' | 'comment_like' | 'share';
  created_at: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content: string;
  };
  comment?: {
    id: string;
    content: string;
    post_id: string;
  };
}

export function Activity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        setCurrentUser(user);
        if (user) {
          await Promise.all([
            fetchActivities(user.id),
            checkAdminStatus(user.id)
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    getUser();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_team')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      setIsAdmin(!!data);
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  const fetchActivities = async (userId: string) => {
    try {
      // Fetch all activities in parallel
      const [
        { data: followers, error: followersError },
        { data: postLikes, error: likesError },
        { data: commentLikes, error: commentLikesError },
        { data: shares, error: sharesError }
      ] = await Promise.all([
        // Followers
        supabase
          .from('followers')
          .select(`
            created_at,
            profiles:follower_id (
              id,
              name,
              email,
              avatar_url
            )
          `)
          .eq('following_id', userId)
          .order('created_at', { ascending: false }),

        // Post likes
        supabase
          .from('likes')
          .select(`
            created_at,
            profiles:user_id (
              id,
              name,
              email,
              avatar_url
            ),
            posts (
              id,
              content
            )
          `)
          .eq('posts.user_id', userId)
          .order('created_at', { ascending: false }),

        // Comment likes
        supabase
          .from('comment_likes')
          .select(`
            created_at,
            profiles:user_id (
              id,
              name,
              email,
              avatar_url
            ),
            comments (
              id,
              content,
              post_id
            )
          `)
          .eq('comments.user_id', userId)
          .order('created_at', { ascending: false }),

        // Post shares
        supabase
          .from('post_shares')
          .select(`
            created_at,
            profiles:user_id (
              id,
              name,
              email,
              avatar_url
            ),
            posts:post_id (
              id,
              content
            )
          `)
          .eq('posts.user_id', userId)
          .order('created_at', { ascending: false })
      ]);

      // Check for errors
      if (followersError) throw followersError;
      if (likesError) throw likesError;
      if (commentLikesError) throw commentLikesError;
      if (sharesError) throw sharesError;

      const allActivities = [
        ...(followers?.map(f => ({
          type: 'follow' as const,
          created_at: f.created_at,
          user: f.profiles,
        })) || []),
        ...(postLikes?.map(l => ({
          type: 'post_like' as const,
          created_at: l.created_at,
          user: l.profiles,
          post: l.posts,
        })) || []),
        ...(commentLikes?.map(l => ({
          type: 'comment_like' as const,
          created_at: l.created_at,
          user: l.profiles,
          comment: l.comments,
        })) || []),
        ...(shares?.map(s => ({
          type: 'share' as const,
          created_at: s.created_at,
          user: s.profiles,
          post: s.posts,
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(allActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'follow':
        return <UserPlus size={20} className="text-primary-300" />;
      case 'post_like':
        return <Heart size={20} className="text-red-500" />;
      case 'comment_like':
        return <MessageCircle size={20} className="text-primary-300" />;
      case 'share':
        return <Share2 size={20} className="text-primary-300" />;
      default:
        return null;
    }
  };

  const getActivityText = (activity: Activity) => {
    const userName = activity.user.name || activity.user.email;
    switch (activity.type) {
      case 'follow':
        return (
          <span>
            <Link to={`/profile/${activity.user.id}`} className="font-semibold hover:text-primary-300">
              {userName}
            </Link>{' '}
            followed you
          </span>
        );
      case 'post_like':
        return (
          <span>
            <Link to={`/profile/${activity.user.id}`} className="font-semibold hover:text-primary-300">
              {userName}
            </Link>{' '}
            liked your post:{' '}
            <Link to={`/post/${activity.post?.id}`} className="text-gray-400 hover:text-primary-300">
              {activity.post?.content.slice(0, 50)}...
            </Link>
          </span>
        );
      case 'comment_like':
        return (
          <span>
            <Link to={`/profile/${activity.user.id}`} className="font-semibold hover:text-primary-300">
              {userName}
            </Link>{' '}
            liked your comment:{' '}
            <Link to={`/post/${activity.comment?.post_id}`} className="text-gray-400 hover:text-primary-300">
              {activity.comment?.content.slice(0, 50)}...
            </Link>
          </span>
        );
      case 'share':
        return (
          <span>
            <Link to={`/profile/${activity.user.id}`} className="font-semibold hover:text-primary-300">
              {userName}
            </Link>{' '}
            shared your post:{' '}
            <Link to={`/post/${activity.post?.id}`} className="text-gray-400 hover:text-primary-300">
              {activity.post?.content.slice(0, 50)}...
            </Link>
          </span>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-16 bg-gray-800 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-8 text-red-500">
              Error loading activities: {error}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 bg-gray-800 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Activity</h1>
            {isAdmin && (
              <div className="flex items-center gap-2 text-primary-300">
                <Shield size={20} />
                <span>Admin</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No activity yet
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={`${activity.type}-${index}`}
                  className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <Profile user={activity.user} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      {getActivityText(activity)}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}