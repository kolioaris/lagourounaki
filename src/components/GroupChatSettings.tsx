import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X } from 'lucide-react';

interface GroupChatSettingsProps {
  group: {
    id: string;
    name: string;
    icon_url?: string;
  };
  onClose: () => void;
  onUpdate: (group: any) => void;
}

export function GroupChatSettings({ group, onClose, onUpdate }: GroupChatSettingsProps) {
  const [name, setName] = useState(group.name);
  const [iconUrl, setIconUrl] = useState(group.icon_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadIcon = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('group-icons')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('group-icons')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading icon:', error);
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const url = await uploadIcon(file);
      if (url) {
        setIconUrl(url);
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      const { data, error: updateError } = await supabase
        .from('group_chats')
        .update({
          name: name.trim(),
          icon_url: iconUrl
        })
        .eq('id', group.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onUpdate(data);
    } catch (err) {
      setError('Failed to update group settings');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Group Settings</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
              {error}
            </div>
          )}

          <div>
            <label className="block text-lg font-medium mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">
              Group Icon
            </label>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isUploading
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-600 hover:border-primary-500 hover:bg-gray-700'
            }`}>
              {iconUrl ? (
                <div className="relative w-24 h-24 mx-auto">
                  <img
                    src={iconUrl}
                    alt="Group icon"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setIconUrl('')}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-300 mb-2">
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                        Uploading...
                      </span>
                    ) : (
                      <>
                        Drop an image here or{' '}
                        <label className="text-primary-300 hover:text-primary-200 cursor-pointer">
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
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className={`w-full py-3 text-lg font-semibold bg-primary-500 text-white rounded-lg transition-colors ${
              isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-600'
            }`}
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}