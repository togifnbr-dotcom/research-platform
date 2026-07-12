import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const STEPS = ['Details', 'Abstract & Keywords', 'Cover Images', 'Upload PDF', 'Review'];

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

export default function StudentDashboard({ user }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    title: '',
    category: '',
    abstract: '',
    keywords: '',
    images: [],
    file: null,
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      update('file', file);
    } else {
      setMessage({ type: 'error', text: 'Please upload a PDF file.' });
    }
  }

  function handleImagesChange(fileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    update('images', [...form.images, ...files].slice(0, 6));
  }

  function removeImage(index) {
    update('images', form.images.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!form.title || !form.abstract || !form.file) {
      setMessage({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const imageUrls = [];
      for (let i = 0; i < form.images.length; i++) {
        const img = form.images[i];
        const imgExt = img.name.split('.').pop();
        const imgPath = `images/${user.id}/${Date.now()}-${i}.${imgExt}`;

        const { error: imgUploadError } = await supabase.storage
          .from('manuscripts-bucket')
          .upload(imgPath, img, { cacheControl: '3600', upsert: false });

        if (imgUploadError) throw imgUploadError;

        const { data: imgUrlData } = supabase.storage
          .from('manuscripts-bucket')
          .getPublicUrl(imgPath);

        imageUrls.push(imgUrlData.publicUrl);
      }

      const fileExt = form.file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('manuscripts-bucket')
        .upload(filePath, form.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf',
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('manuscripts-bucket')
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      const keywordsArray = form.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const { error: insertError } = await supabase.from('manuscripts').insert({
        title: form.title,
        category: form.category || null,
        abstract: form.abstract,
        keywords: keywordsArray,
        author_id: user.id,
        file_url: fileUrl,
        image_urls: imageUrls,
        status: 'pending_review',
      });

      if (insertError) throw insertError;

      setMessage({ type: 'success', text: 'Manuscript submitted for review!' });
      setForm({ title: '', category: '', abstract: '', keywords: '', images: [], file: null });
      setStep(0);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-semibold text-stone-900">
          Submit a Manuscript
        </h1>
        <Link to="/guidelines" className="text-sm text-stone-600 underline hover:text-stone-900">
          Submission Guidelines
        </Link>
      </div>

      <div className="flex items-center gap-2 mt-6 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-medium ${
                i <= step ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'
              }`}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 ${i < step ? 'bg-stone-900' : 'bg-stone-200'}`} />
            )}
          </div>
        ))}
      </div>

      {message && (
        <div
          className={`mb-6 text-sm rounded-md px-4 py-3 ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-lg p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Manuscript Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="w-full rounded-md border border-stone-300 px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-stone-800"
                placeholder="e.g. Machine Learning Approaches to Coral Reef Monitoring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Subject
              </label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full rounded-md border border-stone-300 px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-stone-800 bg-white"
              >
                <option value="">Select a subject...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Abstract
              </label>
              <textarea
                rows={6}
                value={form.abstract}
                onChange={(e) => update('abstract', e.target.value)}
                className="w-full rounded-md border border-stone-300 px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-stone-800"
                placeholder="Summarize your research..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => update('keywords', e.target.value)}
                className="w-full rounded-md border border-stone-300 px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-stone-800"
                placeholder="ecology, machine learning, coral reefs"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-stone-500">
              Optional. Add up to 6 images (figures, diagrams, photos) to feature with your research.
            </p>

            <div
              className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center
                         hover:border-stone-500 transition-colors"
            >
              <label className="text-sm font-medium text-stone-900 underline cursor-pointer">
                Choose images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImagesChange(e.target.files)}
                />
              </label>
            </div>

            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(img)}
                      alt=""
                      className="w-full h-20 object-cover rounded-md border border-stone-200"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-stone-900 text-white rounded-full
                                 w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-stone-300 rounded-lg p-10
                       text-center hover:border-stone-500 transition-colors"
          >
            {form.file ? (
              <p className="text-sm text-stone-700 font-medium">{form.file.name}</p>
            ) : (
              <>
                <p className="text-sm text-stone-500">
                  Drag and drop your PDF here, or
                </p>
                <label className="inline-block mt-3 text-sm font-medium text-stone-900
                                   underline cursor-pointer">
                  browse files
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => update('file', e.target.files?.[0] || null)}
                  />
                </label>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <p><span className="font-medium text-stone-700">Title:</span> {form.title}</p>
            <p><span className="font-medium text-stone-700">Subject:</span> {form.category || 'None'}</p>
            <p><span className="font-medium text-stone-700">Abstract:</span> {form.abstract}</p>
            <p><span className="font-medium text-stone-700">Keywords:</span> {form.keywords}</p>
            <p><span className="font-medium text-stone-700">Images:</span> {form.images.length} attached</p>
            <p><span className="font-medium text-stone-700">File:</span> {form.file?.name || 'None'}</p>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={back}
            disabled={step === 0}
            className="text-sm text-stone-500 disabled:opacity-0 hover:text-stone-800"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              className="text-sm font-medium bg-stone-900 text-white px-5 py-2 rounded-md
                         hover:bg-stone-700 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-sm font-medium bg-stone-900 text-white px-5 py-2 rounded-md
                         hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Manuscript'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
