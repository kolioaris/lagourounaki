import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, Share2, Send, ExternalLink } from 'lucide-react';
import { Comment } from './Comment';
import { ShareModal } from './ShareModal';

interface PostProps {
  post: {
    id: string;
    content: string;
    image_url?: string;
    created_at: string;
    external_url?: string;
    isAdvertisement?: boolean;
    user: {
      id: string;
      email: string;
      name?: string;
    };
    tags?: string[];
    mentions?: string[];
  };
}

export function Post({ post }: PostProps) {
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user && !post.isAdvertisement) {
        checkIfLiked(user.id);
      }
    };
    getUser();
    if (!post.isAdvertisement) {
      fetchLikes();
    }
  }, [post.id, post.isAdvertisement]);

  const fetchLikes = async () => {
    if (post.isAdvertisement) return;
    
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact' })
      .eq('post_id', post.id);
    setLikes(count || 0);
  };

  const checkIfLiked = async (userId: string) => {
    if (post.isAdvertisement) return;

    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', post.id)
      .eq('user_id', userId)
      .maybeSingle();
    setIsLiked(!!data);
  };

  const toggleLike = async () => {
    if (!currentUser || post.isAdvertisement) return;

    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id);
      setLikes(prev => prev - 1);
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: post.id, user_id: currentUser.id });
      setLikes(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const fetchComments = async () => {
    if (post.isAdvertisement) return;

    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        user:user_id (
          id,
          email,
          name
        )
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    setComments(data || []);
  };

  const handleShowComments = () => {
    if (post.isAdvertisement) return;
    setShowComments(!showComments);
    if (!showComments) {
      fetchComments();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || post.isAdvertisement) return;

    const { data: comment } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        user_id: currentUser.id,
        content: newComment
      })
      .select(`
        *,
        user:user_id (
          id,
          email,
          name
        )
      `)
      .single();

    if (comment) {
      setComments(prev => [...prev, comment]);
      setNewComment('');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (post.isAdvertisement) return;

    await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const formatContent = (content: string) => {
    if (!content) return '';
    
    if (content.length <= 600 || isExpanded) {
      return content
        .split(' ')
        .map((word, i) => {
          if (word.startsWith('#')) {
            return (
              <Link
                key={i}
                to={`/tag/${word.slice(1)}`}
                className="text-primary-300 hover:text-primary-200"
              >
                {word}{' '}
              </Link>
            );
          }
          if (word.startsWith('@')) {
            return (
              <Link
                key={i}
                to={`/profile/${word.slice(1)}`}
                className="text-primary-300 hover:text-primary-200"
              >
                {word}{' '}
              </Link>
            );
          }
          return word + ' ';
        });
    }

    return (
      <>
        {content.slice(0, 600)}...{' '}
        <button
          onClick={() => setIsExpanded(true)}
          className="text-primary-300 hover:text-primary-200"
        >
          Show more
        </button>
      </>
    );
  };

  const handleAdClick = () => {
    if (post.isAdvertisement && post.external_url) {
      window.open(post.external_url, '_blank');
    }
  };

  return (
    <div 
      className={`bg-gray-800 rounded-lg shadow-xl mb-4 ${
        post.isAdvertisement ? 'cursor-pointer border border-primary-500/30' : ''
      }`}
      onClick={post.isAdvertisement ? handleAdClick : undefined}
    >
      <div className="flex items-center gap-2 p-4 border-b border-gray-700">
        {post.isAdvertisement ? (
          <div className="flex items-center gap-2">
            <span className="text-primary-300 font-semibold">Sponsored</span>
            <ExternalLink size={16} className="text-primary-300" />
          </div>
        ) : (
          <Link to={`/profile/${post.user.id}`} className="font-semibold hover:text-primary-300">
            {post.user.name || post.user.email}
          </Link>
        )}
        <span className="text-gray-400 text-sm">
          {format(new Date(post.created_at), 'MMM d, yyyy')}
        </span>
      </div>

      {post.image_url && (
        <img
          src={post.image_url}
          alt={post.isAdvertisement ? "Advertisement" : "Post"}
          className="w-full object-cover max-h-96"
        />
      )}
      
      <div className="p-4">
        <p className="mb-4">{formatContent(post.content)}</p>
        
        {!post.isAdvertisement && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={toggleLike}
                className={`flex items-center gap-1.5 text-sm ${
                  isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart
                  size={20}
                  className={isLiked ? 'fill-current' : ''}
                />
                {likes}
              </button>
              
              <button
                onClick={handleShowComments}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-300"
              >
                <MessageCircle size={20} />
                {comments.length}
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-300"
              >
                <Share2 size={20} />
                Share
              </button>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/tag/${tag}`}
                    className="text-sm bg-gray-700 px-2 py-1 rounded-full hover:bg-gray-600"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showComments && (
        <div className="fixed top-0 right-0 w-1/3 h-full bg-gray-800 border-l border-gray-700 overflow-y-auto p-4 z-50">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Comments</h2>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            {comments.map(comment => (
              <Comment
                key={comment.id}
                comment={comment}
                onDelete={
                  currentUser?.id === comment.user.id
                    ? () => handleDeleteComment(comment.id)
                    : undefined
                }
              />
            ))}
            
            <form onSubmit={handleAddComment} className="sticky bottom-0 bg-gray-800 pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showShareModal && (
        <ShareModal
          postId={post.id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}