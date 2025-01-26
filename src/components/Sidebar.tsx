import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PlusSquare, UserCircle, LogOut, MessageCircle, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Bell, label: 'Activity', path: '/activity' },
    { icon: UserCircle, label: 'Profile', path: currentUser ? `/profile/${currentUser.id}` : '#' }
  ];

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#213555] z-50">
        <div className="flex justify-around py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`p-3 rounded-lg ${
                  isActive ? 'text-primary-300' : 'text-gray-400'
                }`}
              >
                <Icon size={24} />
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-[#1a1a1a] border-r border-[#213555] shadow-xl ${
        isExpanded ? 'w-64' : 'w-16'
      } transition-[width] duration-200 ease-in-out z-50`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full py-6">
        <div className="px-4 mb-8 overflow-hidden whitespace-nowrap">
          <div className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-300 to-primary-500 text-transparent bg-clip-text">
              La Gourounaki
            </h1>
          </div>
          <div className={`absolute top-6 left-4 transition-opacity duration-200 ${isExpanded ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-300 to-primary-500 flex items-center justify-center">
              <span className="text-white font-bold">LG</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-3 mb-2 rounded-lg transition-all duration-200 group overflow-hidden ${
                  isActive
                    ? 'bg-primary-500/10 text-primary-300'
                    : 'text-gray-400 hover:bg-primary-500/5 hover:text-primary-300'
                }`}
              >
                <Icon 
                  size={22} 
                  className={`min-w-[22px] transition-transform duration-200 ${
                    isActive ? 'text-primary-300' : 'group-hover:text-primary-300'
                  }`}
                />
                <span 
                  className={`ml-3 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  } ${isActive ? 'text-primary-300' : ''}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-2">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-3 text-gray-400 hover:text-primary-300 hover:bg-primary-500/5 rounded-lg transition-all duration-200 group overflow-hidden"
          >
            <LogOut size={22} className="min-w-[22px] group-hover:text-primary-300" />
            <span 
              className={`ml-3 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}