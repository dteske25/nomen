import { useEffect, useState } from 'react';
import { API } from '../lib/api';
import { Check, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type NameRecord = {
  id: string;
  name: string;
  gender: string;
  origin?: string;
};

export default function Rate() {
  const [names, setNames] = useState<NameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNames = async () => {
    try {
      const data = (await API.getNames()) as NameRecord[];
      // Simple shuffle or filter logic could be added here
      setNames(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNames();
  }, []);

  const handleVote = async (vote: 'like' | 'dislike' | 'superlike') => {
    if (names.length === 0) return;
    const current = names[0];
    
    // Optimistic UI update
    setNames((prev) => prev.slice(1));
    
    try {
      await API.vote(current.id, vote);
    } catch (e) {
      console.error("Failed to submit vote", e);
      // Ideally revert optimistic update here
    }
  };

  if (loading) return <div className="text-center p-10">Loading names...</div>;
  if (names.length === 0) return (
    <div className="text-center p-10 space-y-4">
      <h3 className="text-xl font-bold">All caught up!</h3>
      <p>Check back later for more names or add some new ones.</p>
    </div>
  );

  const currentName = names[0];

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] w-full max-w-sm mx-auto relative">
      <AnimatePresence>
        <motion.div
           key={currentName.id}
           initial={{ scale: 0.9, opacity: 0, y: 20 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           exit={{ scale: 0.8, opacity: 0, x: -200, rotate: -20 }} // Simple exit, swipe logic can be more complex
           className="absolute inset-0 flex flex-col"
        >
          <div className="flex-1 bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
             
             {/* Decorative Background */}
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent"></div>

             <div className="relative z-10">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 tracking-wider ${
                  currentName.gender === 'girl' ? 'bg-pink-100 text-pink-600' :
                  currentName.gender === 'boy' ? 'bg-blue-100 text-blue-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {currentName.gender}
                </span>

                <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tight">
                  {currentName.name}
                </h2>
                
                {currentName.origin && (
                  <p className="text-slate-500 font-medium">
                    {currentName.origin}
                  </p>
                )}
             </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <button 
              onClick={() => handleVote('dislike')}
              className="p-4 bg-white rounded-full shadow-lg text-red-500 hover:bg-red-50 hover:scale-110 transition-all"
            >
              <X size={32} strokeWidth={3} />
            </button>
            <button 
               onClick={() => handleVote('superlike')}
               className="p-3 bg-white rounded-full shadow-lg text-blue-500 hover:bg-blue-50 hover:scale-110 transition-all mt-4"
            >
              <Star size={24} fill="currentColor" />
            </button>
            <button 
              onClick={() => handleVote('like')}
              className="p-4 bg-white rounded-full shadow-lg text-green-500 hover:bg-green-50 hover:scale-110 transition-all"
            >
               <Check size={32} strokeWidth={3} />
            </button>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
