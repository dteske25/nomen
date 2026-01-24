import { useEffect, useState } from 'react';
import { API } from '../lib/api';
import { Sparkles, Loader2, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

type MatchRecord = {
  id: string;
  name: string;
  gender: string;
  createdBy?: string;
};

export default function Matches() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = (await API.getMatches()) as MatchRecord[];
        setMatches(data);
      } catch (e) {
        console.error("Failed to fetch matches", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Finding your matches...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-800 flex items-center justify-center gap-2">
          <PartyPopper className="text-pink-500" />
          Matches
        </h1>
        <p className="text-slate-500 mt-2">Names you both love!</p>
      </div>

      {matches.length === 0 ? (
        <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Sparkles className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">No matches yet.</p>
          <p className="text-sm text-slate-400 mt-1">Keep voting to find the one!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {matches.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-800">{match.name}</h3>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${match.gender === 'girl' ? 'bg-pink-100 text-pink-600' :
                  match.gender === 'boy' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                  {match.gender}
                </span>
                {match.createdBy && (
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    Suggested by {match.createdBy === (localStorage.getItem('userName') || 'anonymous') ? 'you' : match.createdBy}
                  </p>
                )}
              </div>
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
                <Sparkles size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
