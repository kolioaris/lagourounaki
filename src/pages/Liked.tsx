import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Post } from '../components/Post';
import { Sidebar } from '../components/Sidebar';
import { Heart } from 'lucide-react';

export function Liked() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('likes')
        .select(`
          post:posts (
            *,
            user:user_id (
              id,
              email,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setPosts(data.map(item => item.post));
      }
      setIsLoading(false);
    };

    fetchLikedPosts();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 bg-gray-800 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <Heart size={24} className="text-red-500" />
            <h1 className="text-2xl font-bold">Liked Posts</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No liked posts yet
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}