import { useEffect, useState } from 'react';
import { API } from '../lib/api';
import { Check, X, Clock, Sparkles, Loader2, Wand2, Plus, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type NameRecord = {
  id: string;
  name: string;
  gender: string;

};

export default function Rate() {
  const [names, setNames] = useState<NameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<{ title: string; items: string[] } | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [matchName, setMatchName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNames = async () => {
    try {
      const data = (await API.getNames()) as NameRecord[];

      if (!Array.isArray(data)) {
        console.error("Unexpected API response:", data);
        setError(JSON.stringify(data));
        setNames([]);
        return;
      }

      // Fisher-Yates shuffle
      for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
      }

      setNames(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNames();
  }, []);

  const handleVote = async (vote: 'like' | 'dislike' | 'maybe') => {
    if (names.length === 0) return;
    const current = names[0];

    // Optimistic UI update
    setNames((prev) => prev.slice(1));


    try {
      const res = (await API.vote(current.id, vote)) as { status: string, match?: boolean };
      if (res.match) {
        setMatchName(current.name);
      }
    } catch (e) {
      console.error("Failed to submit vote", e);
      // Ideally revert optimistic update here
    }
  };

  const handleGetAlternatives = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentName) return;

    setLoadingModal(true);
    setModalData({ title: 'Alternative Spellings', items: [] });

    try {
      const data = (await API.getAlternatives(currentName.name, currentName.gender)) as { alternatives: string[] };
      if (data.alternatives) {
        setModalData({ title: 'Alternative Spellings', items: data.alternatives });
      }
    } catch (error) {
      console.error("Failed to get alternatives", error);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleGetSimilarVibes = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentName) return;

    setLoadingModal(true);
    setModalData({ title: 'Similar Vibes', items: [] });

    try {
      const data = (await API.getSimilarVibes(currentName.name, currentName.gender)) as { alternatives: string[] };
      // Note: Backend returns 'alternatives' key for similar vibes too as per my implementation
      if (data.alternatives) {
        setModalData({ title: 'Similar Vibes', items: data.alternatives });
      }
    } catch (error) {
      console.error("Failed to get similar vibes", error);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleAddToList = async (name: string) => {
    if (!currentName) return;
    // Add to DB
    try {
      await API.submitName(name, currentName.gender);
      // Visual feedback - simple alert for now or just close/update UI
      // Ideally show a toast, but I'll use a simple alert or just change the icon in the list for this iteration
      // For now, let's just close the modal and let the user know, or maybe better, remove the item from the list to show it's "moved"
      setModalData(prev => prev ? { ...prev, items: prev.items.filter(i => i !== name) } : null);

      // Optionally add to local stack so they can vote on it immediately or later?
      // Let's just add it to the DB. The user can see it in their list eventually or it might come up if we reload.
      // To provide good feedback, let's make it disappear from the list which implies "Action taken".
    } catch (e) {
      console.error("Failed to add name", e);
    }
  };

  if (loading) return <div className="text-center p-10">Loading names...</div>;

  if (error) return (
    <div className="text-center p-10 space-y-4">
      <h3 className="text-xl font-bold text-red-500">Error Loading Names</h3>
      <pre className="bg-red-50 p-4 rounded text-left overflow-auto text-xs text-red-800">
        {error}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Retry
      </button>
    </div>
  );

  if (names.length === 0) return (
    <div className="text-center p-10 space-y-4">
      <h3 className="text-xl font-bold">All caught up!</h3>
      <p>Check back later for more names or add some new ones.</p>
      <button
        onClick={async () => {
          setLoading(true);
          await API.seed();
          // Short delay to allow DB update to propagate if needed, then refetch
          setTimeout(fetchNames, 1000);
        }}
        className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg"
      >
        More Suggestions
      </button>
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
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 tracking-wider ${currentName.gender === 'girl' ? 'bg-pink-100 text-pink-600' :
                currentName.gender === 'boy' ? 'bg-blue-100 text-blue-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                {currentName.gender}
              </span>

              <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tight">
                {currentName.name}
              </h2>



              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleGetAlternatives}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm font-semibold hover:bg-purple-100 transition-colors"
                >
                  <Sparkles size={16} />
                  Spellings
                </button>
                <button
                  onClick={handleGetSimilarVibes}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold hover:bg-blue-100 transition-colors"
                >
                  <Wand2 size={16} />
                  Similar Vibes
                </button>
              </div>
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
              onClick={() => handleVote('maybe')}
              className="p-3 bg-white rounded-full shadow-lg text-yellow-500 hover:bg-yellow-50 hover:scale-110 transition-all mt-4"
            >
              <Clock size={24} strokeWidth={3} />
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

      {/* Alternatives/Similar Modal */}
      <AnimatePresence>
        {modalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setModalData(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="text-purple-500" size={20} />
                  {modalData.title}
                </h3>
                <button
                  onClick={() => setModalData(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <Loader2 className="animate-spin mb-2" size={32} />
                  <p>Conjuring names...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {modalData.items.length > 0 ? (
                    modalData.items.map((alt, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl font-medium text-slate-700 flex justify-between items-center group hover:bg-purple-50 transition-colors">
                        <span>{alt}</span>
                        <button
                          onClick={() => handleAddToList(alt)}
                          className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          title="Add to list"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-500">
                      No suggestions found.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Overlay */}
      <AnimatePresence>
        {matchName && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center"
            onClick={() => setMatchName(null)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <h1 className="text-6xl font-black bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent mb-4 drop-shadow-2xl">
                It's a Match!
              </h1>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", bounce: 0.6 }}
              className="mb-8"
            >
              <div className="bg-white text-slate-900 rounded-3xl px-8 py-4 text-4xl font-black shadow-[0_0_50px_rgba(236,72,153,0.5)] transform -rotate-2">
                {matchName}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-4"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMatchName(null);
                }}
                className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-slate-100 transition-colors"
              >
                Keep Swiping
              </button>
            </motion.div>

            {/* Confetti-ish elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-yellow-400"
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    rotate: 0
                  }}
                  animate={{
                    y: window.innerHeight + 20,
                    rotate: 360
                  }}
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                >
                  <PartyPopper size={24 + Math.random() * 24} />
                </motion.div>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
