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
            <label htmlFor="userName" className="sr-only">Select User</label>
            <div className="relative">
              <select
                id="userName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none bg-white"
                autoFocus
                required
              >
                <option value="" disabled>Select your name</option>
                <option value="Daric">Daric</option>
                <option value="Megan">Megan</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-blue-200"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
