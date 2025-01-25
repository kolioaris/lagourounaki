import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Post as PostComponent } from '../components/Post';
import { Sidebar } from '../components/Sidebar';

export function Post() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_id (
            id,
            email,
            name
          )
        `)
        .eq('id', postId)
        .single();

      if (data) {
        setPost(data);
      } else {
        navigate('/404');
      }
      setLoading(false);
    };

    fetchPost();
  }, [postId, navigate]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 bg-gray-800 p-8">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : post ? (
            <PostComponent post={post} />
          ) : (
            <div className="text-center py-8 text-gray-400">
              Post not found
            </div>
          )}
        </div>
      </main>
    </div>
  );
}