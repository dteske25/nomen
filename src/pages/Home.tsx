import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      <h1 className="text-4xl font-extrabold text-slate-800 text-center">
        Find the perfect name together.
      </h1>
      <p className="text-lg text-slate-600 text-center max-w-xs">
        Swiping, matching, and AI spelling suggestions for our baby.
      </p>
      
      <div className="grid grid-cols-1 gap-4 w-full px-4">
        <Link to="/rate" className="bg-blue-600 text-white rounded-xl py-4 px-6 text-center font-semibold text-lg shadow-lg hover:bg-blue-700 transition-colors">
          Start Swiping
        </Link>
        <Link to="/submit" className="bg-white border border-slate-200 text-slate-700 rounded-xl py-4 px-6 text-center font-semibold text-lg shadow-sm hover:bg-slate-50 transition-colors">
          Add Names Manually
        </Link>
      </div>
    </div>
  );
}
