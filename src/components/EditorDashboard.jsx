import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SUPPORT_EMAIL = 'destsubhi@gmail.com';

export default function EditorDashboard() {
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [helpOpenId, setHelpOpenId] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    setLoading(true);
    const { data, error } = await supabase
      .from('manuscripts')
      .select('id, title, abstract, keywords, file_url, status, featured, peer_reviewed, created_at, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error.message);
    } else {
      setManuscripts(data);
    }
    setLoading(false);
  }

  async function updateStatus(id, status, peerReviewed) {
    setActioningId(id);
    const updatePayload =
      status === 'published' ? { status, peer_reviewed: peerReviewed } : { status };

    const { error } = await supabase
      .from('manuscripts')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error(error.message);
      alert('Failed to update: ' + error.message);
    } else {
      setManuscripts((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updatePayload } : m))
      );
    }
    setActioningId(null);
  }

  async function togglePeerReviewed(id, current) {
    setActioningId(id);
    const { error } = await supabase
      .from('manuscripts')
      .update({ peer_reviewed: !current })
      .eq('id', id);

    if (error) {
      console.error(error.message);
      alert('Failed to update: ' + error.message);
    } else {
      setManuscripts((prev) =>
        prev.map((m) => (m.id === id ? { ...m, peer_reviewed: !current } : m))
      );
    }
    setActioningId(null);
  }

  async function toggleFeatured(id, current) {
    setActioningId(id);
    const { error } = await supabase
      .from('manuscripts')
      .update({ featured: !current })
      .eq('id', id);

    if (error) {
      console.error(error.message);
      alert('Failed to update: ' + error.message);
    } else {
      setManuscripts((prev) =>
        prev.map((m) => (m.id === id ? { ...m, featured: !current } : m))
      );
    }
    setActioningId(null);
  }

  const statusStyles = {
    pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
    published: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-serif font-semibold text-stone-900">
        Editor Review Queue
      </h1>
      <p className="text-stone-500 text-sm mt-1">
        Review, publish, or reject submitted manuscripts.
      </p>

      {loading && <p className="text-sm text-stone-500 mt-6">Loading...</p>}

      <div className="mt-8 space-y-4">
        {manuscripts.map((m) => (
          <div
            key={m.id}
            className="bg-white border border-stone-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif font-semibold text-stone-900">
                  {m.title}
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  {m.profiles?.full_name} - {m.profiles?.email} -{' '}
                  {new Date(m.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {m.featured && (
                  <span className="text-xs font-medium bg-amber-50 text-amber-700
                                   border border-amber-200 px-2.5 py-1 rounded-full">
                    Featured
                  </span>
                )}
                {m.status === 'published' && (
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      m.peer_reviewed
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}
                  >
                    {m.peer_reviewed ? 'Peer-Reviewed' : 'Not Reviewed'}
                  </span>
                )}
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles[m.status]}`}
                >
                  {m.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <p className="text-sm text-stone-700 mt-3 leading-relaxed">
              {m.abstract}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
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
              <a
                href={m.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-stone-700 underline"
              >
                View PDF
              </a>

              {m.status === 'published' && (
                <>
                  <button
                    disabled={actioningId === m.id}
                    onClick={() => toggleFeatured(m.id, m.featured)}
                    className="text-sm font-medium text-amber-700 border border-amber-200
                               px-4 py-1.5 rounded-md hover:bg-amber-50 disabled:opacity-50"
                  >
                    {m.featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button
                    disabled={actioningId === m.id}
                    onClick={() => togglePeerReviewed(m.id, m.peer_reviewed)}
                    className="text-sm font-medium text-sky-700 border border-sky-200
                               px-4 py-1.5 rounded-md hover:bg-sky-50 disabled:opacity-50"
                  >
                    Mark as {m.peer_reviewed ? 'Not Reviewed' : 'Peer-Reviewed'}
                  </button>
                </>
              )}

              <div className="ml-auto flex flex-wrap items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setHelpOpenId(helpOpenId === m.id ? null : m.id)}
                    className="flex items-center gap-1 text-sm font-medium text-stone-500
                               border border-stone-200 rounded-md px-3 py-1.5 hover:bg-stone-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
                      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
                    </svg>
                    Help
                  </button>

                  {helpOpenId === m.id && (
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-stone-200
                                     rounded-md shadow-lg z-10 p-4">
                      <p className="text-sm font-medium text-stone-800 mb-1">Need help reviewing?</p>
                      <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="block text-center text-sm font-medium text-white bg-stone-900
                                   hover:bg-stone-700 rounded-md py-2 transition-colors mt-2"
                      >
                        Contact Support
                      </a>
                    </div>
                  )}
                </div>

                {m.status !== 'published' && (
                  <>
                    <button
                      disabled={actioningId === m.id}
                      onClick={() => updateStatus(m.id, 'published', true)}
                      className="text-sm font-medium bg-stone-900 text-white
                                 px-4 py-1.5 rounded-md hover:bg-stone-700 disabled:opacity-50"
                    >
                      Publish (Peer-Reviewed)
                    </button>
                    <button
                      disabled={actioningId === m.id}
                      onClick={() => updateStatus(m.id, 'published', false)}
                      className="text-sm font-medium text-stone-700 border border-stone-300
                                 px-4 py-1.5 rounded-md hover:bg-stone-50 disabled:opacity-50"
                    >
                      Publish (Not Reviewed)
                    </button>
                  </>
                )}
                {m.status !== 'rejected' && (
                  <button
                    disabled={actioningId === m.id}
                    onClick={() => updateStatus(m.id, 'rejected')}
                    className="text-sm font-medium text-red-600 border border-red-200
                               px-4 py-1.5 rounded-md hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
