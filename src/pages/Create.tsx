import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { CreatePost } from '../components/CreatePost';

export function Create() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-16 bg-gray-800 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Create a New Post</h1>
          <CreatePost />
        </div>
      </main>
    </div>
  );
}