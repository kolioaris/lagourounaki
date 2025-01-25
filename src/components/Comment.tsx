import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, X } from 'lucide-react';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      email: string;
      name?: string;
    };
  };
  onDelete?: () => void;
}

export function Comment({ comment, onDelete }: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        checkIfLiked(user.id);
      }
    };
    getUser();
    fetchLikes();
  }, []);

  const fetchLikes = async () => {
    const { count } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact' })
      .eq('comment_id', comment.id);
    setLikes(count || 0);
  };

  const checkIfLiked = async (userId: string) => {
    const { data } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', comment.id)
      .eq('user_id', userId)
      .single();
    setIsLiked(!!data);
  };

  const toggleLike = async () => {
    if (!currentUser) return;

    if (isLiked) {
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', comment.id)
        .eq('user_id', currentUser.id);
      setLikes(prev => prev - 1);
    } else {
      await supabase
        .from('comment_likes')
        .insert({ comment_id: comment.id, user_id: currentUser.id });
      setLikes(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const fetchReplies = async () => {
    const { data } = await supabase
      .from('comment_replies')
      .select(`
        *,
        user:user_id (
          id,
          email,
          name
        )
      `)
      .eq('comment_id', comment.id)
      .order('created_at', { ascending: true });
    setReplies(data || []);
  };

  const handleShowReplies = () => {
    setShowReplies(!showReplies);
    if (!showReplies) {
      fetchReplies();
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !currentUser) return;

    const { data: reply } = await supabase
      .from('comment_replies')
      .insert({
        comment_id: comment.id,
        user_id: currentUser.id,
        content: replyContent
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

    if (reply) {
      setReplies(prev => [...prev, reply]);
      setReplyContent('');
      setShowReplyForm(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link
              to={`/profile/${comment.user.id}`}
              className="font-semibold hover:text-primary-300"
            >
              {comment.user.name || comment.user.email}
            </Link>
            <span className="text-sm text-gray-400">
              {format(new Date(comment.created_at), 'MMM d, yyyy')}
            </span>
          </div>
          {currentUser?.id === comment.user.id && onDelete && (
            <button
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <p className="text-gray-200 mb-4">{comment.content}</p>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm ${
              isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart
              size={18}
              className={isLiked ? 'fill-current' : ''}
            />
            {likes}
          </button>
          
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-300"
          >
            <MessageCircle size={18} />
            Reply
          </button>
          
          {replies.length > 0 && (
            <button
              onClick={handleShowReplies}
              className="text-sm text-gray-400 hover:text-primary-300"
            >
              {showReplies ? 'Hide' : `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>
      </div>

      {showReplyForm && (
        <form onSubmit={handleAddReply} className="ml-8 flex gap-2">
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Reply
          </button>
        </form>
      )}

      {showReplies && replies.length > 0 && (
        <div className="ml-8 space-y-4">
          {replies.map((reply) => (
            <div key={reply.id} className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Link
                  to={`/profile/${reply.user.id}`}
                  className="font-semibold hover:text-primary-300"
                >
                  {reply.user.name || reply.user.email}
                </Link>
                <span className="text-sm text-gray-400">
                  {format(new Date(reply.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <p className="text-gray-200">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}