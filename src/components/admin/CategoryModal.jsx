import { useState } from 'react';

export default function CategoryModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give the category a name.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave({ name, description, is_published: isPublished });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <h2>{initial ? 'Edit category' : 'New category'}</h2>
        <form className="modal-form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="cat-name">Name</label>
            <input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ocean"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="cat-desc">Description (optional)</label>
            <textarea
              id="cat-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short line about this collection"
            />
          </div>
          <div className="field field-check">
            <input
              id="cat-published"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <label htmlFor="cat-published" style={{ margin: 0 }}>
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
