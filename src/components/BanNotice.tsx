import { supabase } from '../lib/supabase';

interface BanNoticeProps {
  reason: string;
}

export function BanNotice({ reason }: BanNoticeProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@lagourounaki.com';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Account Banned</h2>
        <p className="text-gray-300 mb-6">
          Your account has been banned for the following reason:
        </p>
        <p className="text-white text-lg font-semibold mb-8 p-4 bg-gray-700 rounded-lg">
          {reason}
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleSignOut}
            className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Sign Out
          </button>
          <button
            onClick={handleContactSupport}
            className="flex-1 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}