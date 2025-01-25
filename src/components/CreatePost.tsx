import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';
import { ImageIcon, Send, Upload, X } from 'lucide-react';

export function CreatePost() {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setIsUploading(true);
      const url = await uploadImage(file);
      if (url) {
        setImageUrl(url);
      }
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    multiple: false
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const tags = content.match(/#[a-zA-Z0-9]+/g) || [];
    const mentions = content.match(/@[a-zA-Z0-9]+/g) || [];

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        image_url: imageUrl,
        tags: tags.map(tag => tag.slice(1)),
        mentions: mentions.map(mention => mention.slice(1))
      })
      .select()
      .single();

    if (!error && post) {
      setContent('');
      setImageUrl('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 rounded-lg shadow-xl mb-4">
      <div
        {...getRootProps()}
        className={`mb-4 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging || isUploading
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-gray-600 hover:border-primary-500 hover:bg-gray-700'
        }`}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
      >
        <input {...getInputProps()} />
        <Upload size={48} className="mx-auto mb-4 text-gray-400" />
        <div className="text-gray-300 mb-4">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            <div>
              <span>Drop an image here or click to upload</span>
            </div>
          )}
          <p className="text-sm text-gray-400 mt-2">
            Supported formats: JPG, PNG, GIF (max 4MB)
          </p>
        </div>
      </div>

      {imageUrl && (
        <div className="mb-4 relative">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full rounded-lg"
          />
          <button
            type="button"
            onClick={() => setImageUrl('')}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg mb-4 min-h-[150px] text-gray-100 placeholder-gray-400 resize-none"
      />
      
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isUploading}
          className={`bg-primary-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
            isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-600'
          }`}
        >
          <Send size={20} />
          {isUploading ? 'Uploading...' : 'Post'}
        </button>
      </div>
    </form>
  );
}