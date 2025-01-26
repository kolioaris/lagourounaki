import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Post } from '../components/Post';
import { supabase } from '../lib/supabase';
import { Search as SearchIcon, Users, MessageSquare, UserCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        fetchRecentSearches(user.id);
      }
    };
    getUser();
  }, []);

  const fetchRecentSearches = async (userId: string) => {
    const { data } = await supabase
      .from('recent_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentSearches(data || []);
  };

  const saveSearch = async () => {
    if (!searchTerm.trim() || !currentUser) return;

    // Delete previous searches with the same term and type
    await supabase
      .from('recent_searches')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('search_term', searchTerm)
      .eq('search_type', searchType);

    // Add new search
    await supabase
      .from('recent_searches')
      .insert({
        user_id: currentUser.id,
        search_term: searchTerm,
        search_type: searchType
      });

    fetchRecentSearches(currentUser.id);
  };

  useEffect(() => {
    const search = async () => {
      if (!searchTerm.trim()) {
        setPosts([]);
        setProfiles([]);
        return;
      }

      setIsLoading(true);

      if (searchType === 'posts') {
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
          .or(`content.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
          .order('created_at', { ascending: false });

        setPosts(data || []);
        setProfiles([]);
        await saveSearch();
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false });

        setProfiles(data || []);
        setPosts([]);
        await saveSearch();
      }

      setIsLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, searchType]);

  const handleRecentSearch = (term: string, type: string) => {
    setSearchTerm(term);
    setSearchType(type);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 bg-gray-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${searchType === 'posts' ? 'posts by content or tags' : 'users'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500 text-white placeholder-gray-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSearchType('posts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  searchType === 'posts'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <MessageSquare size={18} />
                Posts
              </button>
              <button
                onClick={() => setSearchType('profiles')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  searchType === 'profiles'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Users size={18} />
                Profiles
              </button>
            </div>

            {recentSearches.length > 0 && !searchTerm && (
              <div className="mt-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-300">
                  <Clock size={20} />
                  Recent Searches
                </h2>
                <div className="grid gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearch(search.search_term, search.search_type)}
                      className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left"
                    >
                      {search.search_type === 'posts' ? (
                        <MessageSquare size={16} className="text-gray-400" />
                      ) : (
                        <Users size={16} className="text-gray-400" />
                      )}
                      <span>{search.search_term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : searchTerm && searchType === 'posts' && posts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No posts found matching your search.
            </div>
          ) : searchTerm && searchType === 'profiles' && profiles.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No profiles found matching your search.
            </div>
          ) : searchType === 'posts' ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {profiles.map((profile) => (
                <Link
                  key={profile.id}
                  to={`/profile/${profile.id}`}
                  className="block bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <UserCircle size={48} className="text-primary-300" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {profile.name || profile.email}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
                      </p>
                      {profile.bio && (
                        <p className="text-gray-300 mt-2">{profile.bio}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}