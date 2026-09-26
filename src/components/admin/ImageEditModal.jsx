import { useState } from 'react';

export default function ImageEditModal({ image, onSave, onClose }) {
  const [title, setTitle] = useState(image.title ?? '');
  const [description, setDescription] = useState(image.description ?? '');
  const [isPublished, setIsPublished] = useState(image.is_published);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ title, description, is_published: isPublished });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <h2>Edit photograph</h2>
        <img
          src={image.thumb_url || image.image_url}
          alt=""
          style={{ width: '100%', borderRadius: 8, marginBottom: '1.1rem', maxHeight: 220, objectFit: 'cover' }}
        />
        <form className="modal-form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="img-title">Title</label>
            <input id="img-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" />
          </div>
          <div className="field">
            <label htmlFor="img-desc">Caption</label>
            <textarea
              id="img-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="field field-check">
            <input
              id="img-published"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <label htmlFor="img-published" style={{ margin: 0 }}>
              Visible on the public site
            </label>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
