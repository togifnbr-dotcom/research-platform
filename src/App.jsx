import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import StudentDashboard from './components/StudentDashboard';
import EditorDashboard from './components/EditorDashboard';
import ManuscriptPage from './components/ManuscriptPage';
import AuthorPage from './components/AuthorPage';
import SubmissionGuidelines from './components/SubmissionGuidelines';

const SUPPORT_EMAIL = 'destsubhi@gmail.com';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error) setProfile(data);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-500 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <nav className="border-b border-stone-200 bg-white px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="SORA" className="h-10 w-10 object-contain" />
          <span className="flex flex-col leading-tight">
            <span className="text-xl font-serif font-bold text-stone-900 tracking-tight">
              SORA
            </span>
            <span className="text-[11px] tracking-wide text-stone-500 uppercase">
              Student Open Research Archive
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          <Link to="/guidelines" className="text-stone-600 hover:text-stone-900">
            Guidelines
          </Link>

          <div className="relative">
            <button
              onClick={() => setHelpOpen((o) => !o)}
              className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" />
              </svg>
              Help
            </button>

            {helpOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200
                               rounded-md shadow-lg z-10 p-4">
                <p className="text-sm font-medium text-stone-800 mb-1">Need help?</p>
                <p className="text-xs text-stone-500 mb-3">
                  Reach out and we'll get back to you.
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="block text-center text-sm font-medium text-white bg-stone-900
                             hover:bg-stone-700 rounded-md py-2 transition-colors"
                >
                  Contact Support
                </a>
                <p className="text-[11px] text-stone-400 mt-2 text-center">{SUPPORT_EMAIL}</p>
              </div>
            )}
          </div>

          {session ? (
            <>
              {profile?.role === 'editor' ? (
                <Link to="/editor" className="text-stone-600 hover:text-stone-900">
                  Editor Queue
                </Link>
              ) : (
                <Link to="/dashboard" className="text-stone-600 hover:text-stone-900">
                  Submit Research
                </Link>
              )}
              <Link to={`/author/${session.user.id}`} className="text-stone-600 hover:text-stone-900">
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-stone-600 hover:text-stone-900"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link to="/auth" className="text-stone-600 hover:text-stone-900">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/manuscript/:id" element={<ManuscriptPage session={session} />} />
        <Route path="/author/:id" element={<AuthorPage session={session} />} />
        <Route path="/guidelines" element={<SubmissionGuidelines />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/auth"
          element={session ? <Navigate to="/" /> : <AuthPage />}
        />
        <Route
          path="/dashboard"
          element={
            session ? (
              <StudentDashboard user={session.user} />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/editor"
          element={
            session && profile?.role === 'editor' ? (
              <EditorDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
