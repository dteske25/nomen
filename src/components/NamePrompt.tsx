import React, { useState } from 'react';

interface NamePromptProps {
  isOpen: boolean;
  onSave: (name: string) => void;
}

export default function NamePrompt({ isOpen, onSave }: NamePromptProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Welcome!</h2>
        <p className="text-slate-600 mb-6 text-center">
          Please enter your name to get started.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userName" className="sr-only">Your Name</label>
            <input
              type="text"
              id="userName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              autoFocus
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-blue-200"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
