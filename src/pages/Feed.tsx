import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Post } from '../components/Post';
import { Sidebar } from '../components/Sidebar';
import { Users, Sparkles, Clock } from 'lucide-react';

export function Feed() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [currentUser, setCurrentUser] = useState(null);
  const [ads, setAds] = useState([]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      const { data: advertisements } = await supabase
        .from('advertisements')
        .select('*')
        .eq('active', true);
      setAds(advertisements || []);
    };
    fetchAds();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:user_id (
            id,
            email
          )
        `);

      if (activeTab === 'team') {
        // Get posts from team members
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_leader_id', currentUser?.id);

        if (teamMembers?.length > 0) {
          const teamUserIds = teamMembers.map(member => member.user_id);
          query = query.in('user_id', teamUserIds);
        } else {
          setPosts([]);
          setIsLoading(false);
          return;
        }
      } else if (activeTab === 'new') {
        query = query.order('created_at', { ascending: false });
      } else {
        // Feed tab: Show random posts that haven't been seen
        const { data: seenPostIds } = await supabase
          .from('seen_posts')
          .select('post_id')
          .eq('user_id', currentUser?.id);

        if (seenPostIds?.length > 0) {
          query = query.not('id', 'in', `(${seenPostIds.map(p => p.post_id).join(',')})`);
        }
        
        // Add random ordering
        query = query.order('created_at', { ascending: false }).limit(10);
      }

      const { data } = await query;

      if (data) {
        // Insert ads after every 10 posts
        const postsWithAds = [];
        data.forEach((post, index) => {
          postsWithAds.push(post);
          if ((index + 1) % 10 === 0 && ads.length > 0) {
            const adIndex = Math.floor(Math.random() * ads.length);
            const ad = ads[adIndex];
            postsWithAds.push({
              id: `ad-${ad.id}`,
              content: ad.content,
              image_url: ad.image_url,
              created_at: new Date().toISOString(),
              external_url: ad.external_url,
              isAdvertisement: true,
              user: {
                id: 'sponsored',
                name: 'Sponsored',
                email: 'sponsored@lagourounaki.com'
              }
            });
          }
        });
        
        setPosts(postsWithAds);
        
        // Mark posts as seen if in feed tab
        if (activeTab === 'feed' && currentUser) {
          const seenPosts = data.map(post => ({
            user_id: currentUser.id,
            post_id: post.id
          }));
          
          await supabase.from('seen_posts').upsert(seenPosts);
        }
      }
      
      setIsLoading(false);
    };

    if (currentUser) {
      fetchPosts();
    }
  }, [activeTab, currentUser, ads]);

  const tabs = [
    { id: 'feed', label: 'Feed', icon: Sparkles },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'new', label: 'New', icon: Clock }
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 bg-gray-800 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 mb-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {activeTab === 'team' 
                ? "No team posts available. Add team members to see their posts!"
                : "No posts available."}
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