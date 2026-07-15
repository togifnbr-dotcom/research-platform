import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function ManuscriptPage({ session }) {
  const { id } = useParams();
  const [manuscript, setManuscript] = useState(null);
  const [comments, setComments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    loadManuscriptAndCountView();
    fetchComments();
    fetchRatings();
  }, [id]);

  // Increment the view first, THEN fetch the manuscript, so the number
  // shown on screen already reflects this current visit.
  async function loadManuscriptAndCountView() {
    setLoading(true);

    const { error: rpcError } = await supabase.rpc('increment_manuscript_views', {
      manuscript_id: id,
    });

    if (rpcError) {
      console.error('View count increment failed:', rpcError.message);
    }

    const { data, error } = await supabase
      .from('manuscripts')
      .select(
        'id, title, abstract, keywords, category, file_url, image_urls, view_count, author_id, published_at, created_at, profiles(full_name)'
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error(error.message);
      setManuscript(null);
    } else {
      setManuscript(data);
    }
    setLoading(false);
  }

  async function fetchComments() {
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, created_at, author_id, profiles(full_name)')
      .eq('manuscript_id', id)
      .order('created_at', { ascending: true });

    if (!error) setComments(data);
  }

  async function fetchRatings() {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating, author_id')
      .eq('manuscript_id', id);

    if (!error) {
      setRatings(data);
      if (session) {
        const mine = data.find((r) => r.author_id === session.user.id);
        if (mine) setMyRating(mine.rating);
      }
    }
  }

  async function handleRate(value) {
    if (!session) return;
    setMyRating(value);

    const { error } = await supabase
      .from('ratings')
      .upsert(
        { manuscript_id: id, author_id: session.user.id, rating: value },
        { onConflict: 'manuscript_id,author_id' }
      );

    if (!error) fetchRatings();
  }

  async function handlePostComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setPosting(true);
    setError(null);

    const { error } = await supabase.from('comments').insert({
      manuscript_id: id,
      author_id: session.user.id,
      content: newComment.trim(),
    });

    if (error) {
      setError(error.message);
    } else {
      setNewComment('');
      fetchComments();
    }
    setPosting(false);
  }

  async function handleDeleteComment(commentId) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)
      : null;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-stone-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!manuscript) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-stone-500 text-sm">Manuscript not found.</p>
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

      <article className="bg-white border border-stone-200 rounded-lg p-8 mt-4">
        {manuscript.image_urls && manuscript.image_urls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {manuscript.image_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-full h-32 object-cover rounded-md border border-stone-200"
              />
            ))}
          </div>
        )}

        {manuscript.published_at && (
          <p className="text-xs font-medium text-green-700 bg-green-50 border border-green-200
                       inline-block px-3 py-1 rounded-full mb-4">
            Peer-reviewed and approved on{' '}
            {new Date(manuscript.published_at).toLocaleDateString()}
          </p>
        )}

        {manuscript.category && (
          <span className="block w-fit text-xs font-medium bg-sky-50 text-sky-700
                           border border-sky-200 px-2.5 py-1 rounded-full mb-3">
            {manuscript.category}
          </span>
        )}

        <h1 className="text-2xl font-serif font-semibold text-stone-900">
          {manuscript.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <p className="text-sm text-stone-500">
            <Link to={`/author/${manuscript.author_id}`} className="hover:underline">
              {manuscript.profiles?.full_name || 'Unknown Author'}
            </Link>{' '}
            - {new Date(manuscript.created_at).toLocaleDateString()}
          </p>
          <span className="text-xs text-stone-400">{manuscript.view_count} views</span>
        </div>

        <p className="text-stone-700 text-sm mt-5 leading-relaxed whitespace-pre-line">
          {manuscript.abstract}
        </p>

        <div className="flex flex-wrap gap-2 mt-5">
          {manuscript.keywords?.map((k) => (
            <span
              key={k}
              className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full"
            >
              {k}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setShowPdf((s) => !s)}
            className="text-sm font-medium text-stone-700 border border-stone-300
                       rounded-md px-4 py-2 hover:bg-stone-50 transition-colors"
          >
            {showPdf ? 'Hide PDF' : 'Open PDF'}
          </button>
          <a
            href={manuscript.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-medium text-white
                       bg-stone-900 hover:bg-stone-700 rounded-md px-4 py-2
                       transition-colors"
          >
            Download PDF
          </a>
        </div>

        {showPdf && (
          <iframe
            src={manuscript.file_url}
            title="PDF preview"
            className="w-full h-[70vh] mt-4 rounded-md border border-stone-200"
          />
        )}

        <div className="mt-6 pt-6 border-t border-stone-200">
          <p className="text-sm font-medium text-stone-700 mb-1">
            {avgRating ? `${avgRating} average` : 'No ratings yet'}{' '}
            {ratings.length > 0 && `(${ratings.length})`}
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                disabled={!session}
                onClick={() => handleRate(star)}
                className={`text-2xl leading-none ${
                  star <= myRating ? 'text-amber-500' : 'text-stone-300'
                } ${session ? 'hover:text-amber-400 cursor-pointer' : 'cursor-not-allowed'}`}
              >
                ★
              </button>
            ))}
          </div>
          {!session && (
            <p className="text-xs text-stone-400 mt-1">
              <Link to="/auth" className="underline">Sign in</Link> to leave a rating.
            </p>
          )}
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-lg font-serif font-semibold text-stone-900 mb-4">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h2>

        {session ? (
          <form onSubmit={handlePostComment} className="mb-6">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share a thought or question about this research..."
              className="w-full rounded-md border border-stone-300 px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-stone-800"
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            <button
              type="submit"
              disabled={posting || !newComment.trim()}
              className="mt-2 text-sm font-medium bg-stone-900 text-white px-4 py-2
                         rounded-md hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              {posting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-stone-500 mb-6">
            <Link to="/auth" className="underline text-stone-700">Sign in</Link> to leave a comment.
          </p>
        )}

        <div className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-stone-500">No comments yet. Be the first to respond.</p>
          )}

          {comments.map((c) => (
            <div key={c.id} className="border border-stone-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-stone-800">
                  {c.profiles?.full_name || 'Anonymous'}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  {session?.user?.id === c.author_id && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-stone-700 mt-2 leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
