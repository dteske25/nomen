import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Matches from './pages/Matches';
import History from './pages/History';
import HomePage from './pages/Home';
import Submit from './pages/Submit';
import Rate from './pages/Rate';
import NamePrompt from './components/NamePrompt';
import { Home as HomeIcon, PlusCircle, Heart, Sparkles, History as HistoryIcon } from 'lucide-react';

import { UserProvider, useUser } from './context/UserContext';

function Layout() {
  const { userName, setUserName } = useUser();
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Check if name is valid
  useEffect(() => {
    const isValid = userName === 'Daric' || userName === 'Megan';

    if (!isValid) {
      if (userName) {
        // If they have a name but it's invalid (not Daric/Megan), clear it immediately and show prompt
        setUserName('');
        setShowNamePrompt(true);
      } else {
        // If no name, wait for interacton
        const handleInteraction = () => {
          // Check again, in case it was set elsewhere
          if (!userName) {
            setShowNamePrompt(true);
          }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => {
          window.removeEventListener('click', handleInteraction);
          window.removeEventListener('keydown', handleInteraction);
        };
      }
    }
  }, [userName, setUserName]);

  const handleSaveName = (name: string) => {
    setUserName(name);
    setShowNamePrompt(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NamePrompt isOpen={showNamePrompt} onSave={handleSaveName} />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
          Nomen
        </Link>
        <nav className="flex gap-4">
          <Link to="/" className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
            <HomeIcon size={24} />
          </Link>
          <Link to="/submit" className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
            <PlusCircle size={24} />
          </Link>
          <Link to="/rate" className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
            <Heart size={24} />
          </Link>
          <Link to="/matches" className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full relative">
            <Sparkles size={24} />
          </Link>
          <Link to="/history" className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
            <HistoryIcon size={24} />
          </Link>
        </nav>
      </header>
      <main className="max-w-md mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/rate" element={<Rate />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </UserProvider>
  );
}
