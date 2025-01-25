import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Calendar, Upload } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [showCreationDate, setShowCreationDate] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const url = await uploadAvatar(file);
      if (url) {
        setAvatarUrl(url);
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    if (!bio.trim() || bio.trim().length < 10) {
      setError('Bio must be at least 10 characters long');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
          show_email: showEmail,
          show_creation_date: showCreationDate,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (dbError) {
        if (dbError.code === '23505') {
          setError('This name is already taken. Please choose another one.');
        } else {
          setError('An error occurred while updating your profile.');
        }
        return;
      }

      onComplete();
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-8">Welcome! Let's set up your profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-32 h-32 mb-4">
              {avatarUrl ? (
                <>
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center">
                  <User size={64} className="text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="w-full max-w-sm">
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isUploading
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-600 hover:border-primary-500 hover:bg-gray-700'
              }`}>
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-300 mb-4">
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                      Uploading...
                    </span>
                  ) : (
                    <>
                      Drop an image here or{' '}
                      <label className="text-primary-300 hover:text-primary-200 font-medium cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        browse
                      </label>
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  Supported formats: JPG, PNG, GIF (max 4MB)
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
              {error}
            </div>
          )}

          <div>
            <label className="block text-lg font-medium mb-2">
              Name (Required)
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 h-6 w-6 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full pl-12 pr-4 py-3 text-lg bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                required
                minLength={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">
              Bio (Required)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself (minimum 10 characters)"
              className="w-full p-4 text-lg bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
              rows={4}
              required
              minLength={10}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-primary-500 focus:ring-primary-500"
              />
              <Mail size={20} className="text-gray-400" />
              <span className="text-lg">Show email on profile</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={showCreationDate}
                onChange={(e) => setShowCreationDate(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-primary-500 focus:ring-primary-500"
              />
              <Calendar size={20} className="text-gray-400" />
              <span className="text-lg">Show account creation date</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className={`w-full py-4 text-lg font-semibold bg-primary-500 text-white rounded-lg transition-colors ${
              isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-600'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}