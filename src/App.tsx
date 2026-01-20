import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home as HomeIcon, PlusCircle, Heart } from 'lucide-react';
import HomePage from './pages/Home';
import Submit from './pages/Submit';
import Rate from './pages/Rate';

function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
          BabyNamePicker
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
        </nav>
      </header>
      <main className="max-w-md mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/rate" element={<Rate />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
