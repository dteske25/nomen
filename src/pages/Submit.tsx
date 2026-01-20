import { useState } from 'react';
import { API } from '../lib/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Submit() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('neutral');
  const [origin, setOrigin] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setStatus('submitting');
    try {
      await API.submitName(name, gender, origin);
      setStatus('success');
      setName('');
      setOrigin('');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Add a New Name</h2>
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg border border-slate-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
            placeholder="e.g. Avery"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
          <div className="flex gap-2">
            {['boy', 'girl', 'neutral'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold capitalize border ${
                  gender === g 
                    ? 'bg-gradient-to-r from-blue-500 to-pink-500 text-white border-transparent'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">Origin (Optional)</label>
          <input 
            type="text" 
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
            placeholder="e.g. English"
          />
        </div>

        <button 
          type="submit" 
          disabled={status === 'submitting'}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {status === 'submitting' ? 'Saving...' : 'Add Name'}
        </button>

        {status === 'success' && (
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle size={20} /> Saved!
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center justify-center gap-2 text-red-600 font-medium animate-in fade-in slide-in-from-bottom-2">
            <XCircle size={20} /> Error saving name.
          </div>
        )}
      </form>
    </div>
  );
}
