import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthorPage({ session }) {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const [saving, setSaving] = useState(false);

  const isOwnProfile = session?.user?.id === id;

  useEffect(() => {
    fetchProfile();
    fetchManuscripts();
  }, [id]);

  async function fetchProfile() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, bio, role')
      .eq('id', id)
      .single();

    if (!error) {
      setProfile(data);
      setBioDraft(data.bio || '');
      setNameDraft(data.full_name || '');
    }
    setLoading(false);
  }

  async function fetchManuscripts() {
    const { data, error } = await supabase
      .from('manuscripts')
      .select('id, title, abstract, keywords, category, image_urls, view_count, created_at')
      .eq('author_id', id)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (!error) setManuscripts(data);
  }

  async function handleSaveBio() {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ bio: bioDraft })
      .eq('id', id);

    if (!error) {
      setProfile((prev) => ({ ...prev, bio: bioDraft }));
      setEditingBio(false);
    }
    setSaving(false);
  }

  async function handleSaveName() {
    if (!nameDraft.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: nameDraft.trim() })
      .eq('id', id);

    if (!error) {
      setProfile((prev) => ({ ...prev, full_name: nameDraft.trim() }));
      setEditingName(false);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-stone-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-stone-500 text-sm">Author not found.</p>
        <Link to="/" className="text-sm text-stone-700 underline mt-2 inline-block">
          Back to archive
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/" className="text-sm text-stone-500 hover:text-stone-800">
        ← Back to archive
      </Link>

      <div className="bg-white border border-stone-200 rounded-lg p-8 mt-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-stone-200 flex items-center justify-center
                          text-xl font-serif font-semibold text-stone-600 shrink-0">
            {profile.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="text-lg font-serif font-semibold text-stone-900 border border-stone-300
                             rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="text-sm font-medium bg-stone-900 text-white px-3 py-1.5
                             rounded-md hover:bg-stone-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameDraft(profile.full_name || '');
                  }}
                  className="text-sm text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-semibold text-stone-900">
                  {profile.full_name}
                </h1>
                {isOwnProfile && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-xs text-stone-500 underline"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
            {profile.role === 'editor' && (
              <span className="text-xs font-medium bg-amber-50 text-amber-700
                               border border-amber-200 px-2 py-0.5 rounded-full inline-block mt-1">
                Editor
              </span>
            )}
          </div>
        </div>

        <div className="mt-5">
          {editingBio ? (
            <div>
              <textarea
                rows={3}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                placeholder="Write a short bio..."
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveBio}
                  disabled={saving}
                  className="text-sm font-medium bg-stone-900 text-white px-4 py-1.5
                             rounded-md hover:bg-stone-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditingBio(false);
                    setBioDraft(profile.bio || '');
                  }}
                  className="text-sm text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-stone-700 leading-relaxed">
                {profile.bio || (isOwnProfile ? 'Add a short bio to introduce yourself.' : 'No bio yet.')}
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => setEditingBio(true)}
                  className="text-xs text-stone-500 underline mt-1"
                >
                  {profile.bio ? 'Edit bio' : 'Add bio'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <h2 className="text-lg font-serif font-semibold text-stone-900 mt-8 mb-4">
        Published Research ({manuscripts.length})
      </h2>

      <div className="grid gap-4">
        {manuscripts.length === 0 && (
          <p className="text-sm text-stone-500">No published manuscripts yet.</p>
        )}

        {manuscripts.map((m) => (
          <Link
            key={m.id}
            to={`/manuscript/${m.id}`}
            className="block bg-white border border-stone-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-2 mb-1">
              {m.category && (
                <span className="text-xs font-medium bg-sky-50 text-sky-700
                                 border border-sky-200 px-2 py-0.5 rounded-full">
                  {m.category}
                </span>
              )}
              <span className="text-xs text-stone-400">{m.view_count} views</span>
            </div>
            <h3 className="text-base font-serif font-semibold text-stone-900">
              {m.title}
            </h3>
            <p className="text-sm text-stone-600 mt-2 line-clamp-2">{m.abstract}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
