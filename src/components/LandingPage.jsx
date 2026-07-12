import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const SORT_OPTIONS = [
  { key: 'latest', label: 'Latest' },
  { key: 'featured', label: 'Featured posts' },
  { key: 'popular', label: 'Most popular' },
  { key: '7days', label: '7 days popular' },
  { key: 'review', label: 'By review score' },
  { key: 'random', label: 'Random' },
];

const CATEGORIES = [
  'Biology',
  'Chemistry',
  'Computer Science',
  'Math',
  'Neuroscience',
  'Physics',
  'Policy',
  'Social Sciences',
];

export default function LandingPage() {
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pdfModalUrl, setPdfModalUrl] = useState(null);

  useEffect(() => {
    fetchManuscripts();
  }, []);

  async function fetchManuscripts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('manuscripts')
      .select(
        'id, title, abstract, keywords, category, file_url, image_urls, view_count, featured, author_id, created_at, profiles(full_name), ratings(rating)'
      )
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching manuscripts:', error.message);
    } else {
      setManuscripts(data);
    }
    setLoading(false);
  }

  function avgRating(m) {
    if (!m.ratings || m.ratings.length === 0) return null;
    const sum = m.ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / m.ratings.length;
  }

  const filtered = manuscripts.filter((m) => {
    const q = query.toLowerCase();
    const matchesQuery =
      m.title.toLowerCase().includes(q) ||
      m.keywords?.some((k) => k.toLowerCase().includes(q)) ||
      m.profiles?.full_name?.toLowerCase().includes(q);
    const matchesCategory = !selectedCategory || m.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  function sortManuscripts(list) {
    const copy = [...list];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    switch (sortKey) {
      case 'featured':
        return copy
          .filter((m) => m.featured)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'popular':
        return copy.sort((a, b) => b.view_count - a.view_count);
      case '7days':
        return copy
          .filter((m) => new Date(m.created_at).getTime() >= sevenDaysAgo)
          .sort((a, b) => b.view_count - a.view_count);
      case 'review':
        return copy.sort((a, b) => {
          const ra = avgRating(a) ?? -1;
          const rb = avgRating(b) ?? -1;
          return rb - ra;
        });
      case 'random':
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      case 'latest':
      default:
        return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }

  const sorted = sortManuscripts(filtered);
  const currentLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label || 'Latest';

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SORA" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-3xl font-serif font-semibold text-stone-900">
                SORA
              </h1>
              <p className="text-stone-500 text-sm">
                Student Open Research Archive - Accessible - Peer-Reviewed - Free
              </p>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search by title, keyword, or author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-6 w-full rounded-md border border-stone-300 px-4 py-2.5
                       text-sm focus:outline-none focus:ring-2 focus:ring-stone-800
                       focus:border-transparent"
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row gap-8">
        <aside className="sm:w-48 shrink-0">
          <button
            onClick={() => setSubjectsOpen((o) => !o)}
            className="flex items-center justify-between w-full text-sm font-bold
                       text-stone-900 uppercase tracking-wide pb-2 border-b-2 border-sky-500"
          >
            Subjects
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              className={`transition-transform ${subjectsOpen ? 'rotate-180' : ''}`}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          {subjectsOpen && (
            <ul className="mt-3 space-y-2.5">
              <li>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`text-sm ${
                    !selectedCategory
                      ? 'font-semibold text-stone-900'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All
                </button>
              </li>
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-sm text-left ${
                      selectedCategory === cat
                        ? 'font-semibold text-stone-900'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-stone-500">
              {sorted.length} {sorted.length === 1 ? 'result' : 'results'}
            </p>

            <div className="relative">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-medium text-stone-700
                           bg-white border border-stone-300 rounded-md px-4 py-2
                           hover:bg-stone-50 transition-colors"
              >
                {currentLabel.toUpperCase()}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-stone-200
                                 rounded-md shadow-lg z-10 py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSortKey(opt.key);
                        setSortOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-stone-50 ${
                        sortKey === opt.key
                          ? 'text-stone-900 font-medium'
                          : 'text-stone-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading && <p className="text-stone-500 text-sm">Loading manuscripts...</p>}

          {!loading && sorted.length === 0 && (
            <p className="text-stone-500 text-sm">No manuscripts found.</p>
          )}

          <div className="grid gap-5">
            {sorted.map((m) => {
              const rating = avgRating(m);
              return (
                <article
                  key={m.id}
                  className="bg-white border border-stone-200 rounded-lg p-6
                             hover:shadow-sm transition-shadow"
                >
                  {m.image_urls && m.image_urls.length > 0 && (
                    <img
                      src={m.image_urls[0]}
                      alt=""
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {m.category && (
                      <span className="text-xs font-medium bg-sky-50 text-sky-700
                                       border border-sky-200 px-2 py-0.5 rounded-full">
                        {m.category}
                      </span>
                    )}
                    {m.featured && (
                      <span className="text-xs font-medium bg-amber-50 text-amber-700
                                       border border-amber-200 px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                    {rating !== null && (
                      <span className="text-xs text-stone-500">
                        ★ {rating.toFixed(1)} ({m.ratings.length})
                      </span>
                    )}
                    <span className="text-xs text-stone-400">
                      {m.view_count} views
                    </span>
                  </div>

                  <Link to={`/manuscript/${m.id}`}>
                    <h2 className="text-lg font-serif font-semibold text-stone-900 hover:underline">
                      {m.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-stone-500 mt-1">
                    <Link to={`/author/${m.author_id}`} className="hover:underline">
                      {m.profiles?.full_name || 'Unknown Author'}
                    </Link>{' '}
                    - {new Date(m.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-stone-700 text-sm mt-3 leading-relaxed">
                    {m.abstract}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {m.keywords?.map((k) => (
                      <span
                        key={k}
                        className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full"
                      >
                        {k}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-5">
                    <Link
                      to={`/manuscript/${m.id}`}
                      className="text-sm font-medium text-stone-700 underline"
                    >
                      View & Comment
                    </Link>
                    <button
                      onClick={() => setPdfModalUrl(m.file_url)}
                      className="text-sm font-medium text-stone-700 border border-stone-300
                                 rounded-md px-4 py-2 hover:bg-stone-50 transition-colors"
                    >
                      Open PDF
                    </button>
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm font-medium text-white
                                 bg-stone-900 hover:bg-stone-700 rounded-md px-4 py-2
                                 transition-colors"
                    >
                      Download PDF
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>

      {pdfModalUrl && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
          onClick={() => setPdfModalUrl(null)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-4xl h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
              <p className="text-sm font-medium text-stone-700">PDF Preview</p>
              <button
                onClick={() => setPdfModalUrl(null)}
                className="text-stone-500 hover:text-stone-800 text-sm"
              >
                Close ✕
              </button>
            </div>
            <iframe
              src={pdfModalUrl}
              title="PDF preview"
              className="flex-1 w-full rounded-b-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
