import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Post } from '../components/Post';
import { Hash } from 'lucide-react';

export function TagPosts() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select(
          `
          *,
          user:user_id (
            id,
            email
          )
        `
        )
        .contains('tags', [tag])
        .order('created_at', { ascending: false });

      if (data) setPosts(data);
    };

    fetchPosts();
  }, [tag]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-8 text-primary-300">
        <Hash size={24} />
        <h1 className="text-2xl font-bold">#{tag}</h1>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
