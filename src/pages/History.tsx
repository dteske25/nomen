import { useEffect, useState } from 'react';
import { API } from '../lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

type VoteRecord = {
  nameId: string;
  vote: 'like' | 'dislike' | 'superlike';
  name: string;
  gender: string;
  createdAt: string;
};

export default function History() {
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVotes();
  }, []);

  const loadVotes = async () => {
    try {
      const data = await API.getVotes();
      if (Array.isArray(data)) {
        setVotes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVote = async (nameId: string, newVote: 'like' | 'dislike' | 'superlike') => {
    // Optimistic update
    setVotes(prev => prev.map(v => 
      v.nameId === nameId ? { ...v, vote: newVote } : v
    ));

    try {
      await API.vote(nameId, newVote);
    } catch (e) {
      console.error(e);
      // Revert would be complex without deep copy or refetch, just refetch for now if error
      loadVotes();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pb-20">
      <div className="w-full max-w-md">
        <header className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Your Votes</h1>
        </header>

        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading history...</div>
        ) : votes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No votes yet.</p>
            <Link to="/rate" className="text-purple-600 font-semibold mt-2 inline-block">Start rating names</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {votes.map((vote, i) => (
              <motion.div 
                key={vote.nameId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    {vote.name}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      vote.gender === 'girl' ? 'bg-pink-100 text-pink-600' :
                      vote.gender === 'boy' ? 'bg-blue-100 text-blue-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {vote.gender}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {new Date(vote.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                   {/* Dislike Loop */}
                  <button
                    onClick={() => handleUpdateVote(vote.nameId, 'dislike')}
                    className={`p-2 rounded-full transition-colors ${
                      vote.vote === 'dislike' 
                        ? 'bg-red-500 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                    {/* Superlike Loop */}
                  <button
                    onClick={() => handleUpdateVote(vote.nameId, 'superlike')}
                    className={`p-2 rounded-full transition-colors ${
                      vote.vote === 'superlike' 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Star size={16} fill="currentColor" />
                  </button>
                    {/* Like Loop */}
                  <button
                    onClick={() => handleUpdateVote(vote.nameId, 'like')}
                    className={`p-2 rounded-full transition-colors ${
                      vote.vote === 'like' 
                        ? 'bg-green-500 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Check size={16} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
