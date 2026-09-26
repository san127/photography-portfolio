import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { uploadPhoto, friendlyError } from '../../lib/api.js';

let uid = 0;
const nextId = () => `f${++uid}`;

export default function UploadModal({ categories, defaultCategoryId, onUploaded, onClose }) {
  const [categoryId, setCategoryId] = useState(defaultCategoryId || categories[0]?.id || '');
  const [items, setItems] = useState([]); // { id, file, previewUrl, title, status, error }
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const uploading = items.some((i) => i.status === 'uploading');

  useEffect(
    () => () => items.forEach((i) => URL.revokeObjectURL(i.previewUrl)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const addFiles = (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    const next = files.map((file) => ({
      id: nextId(),
      file,
      previewUrl: URL.createObjectURL(file),
      title: '',
      status: 'pending',
      error: '',
    }));
    setItems((prev) => [...prev, ...next]);
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setTitle = (id, title) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, title } : i)));

  const startUpload = async () => {
    if (!categoryId || items.length === 0) return;
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', error: '' } : i)));
      try {
        const saved = await uploadPhoto({ file: item.file, categoryId, title: item.title });
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'done' } : i)));
        onUploaded(saved);
      } catch (err) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: friendlyError(err) } : i))
        );
      }
    }
  };

  const allDone = items.length > 0 && items.every((i) => i.status === 'done');

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && !uploading && onClose()}>
      <div className="modal-card" style={{ maxWidth: 560 }}>
        <h2>Upload photographs</h2>

        <div className="field" style={{ marginBottom: '1rem' }}>
          <label htmlFor="upload-category">Category</label>
          <select
            id="upload-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={uploading}
            style={{
              padding: '0.6rem 0.7rem',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface-raised)',
            }}
          >
            {categories.length === 0 && <option value="">Create a category first</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`upload-drop${dragOver ? ' is-drag' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <UploadCloud size={22} style={{ marginBottom: 6 }} />
          <div>Click to choose photos, or drag them here</div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {items.length > 0 && (
          <div className="upload-queue" style={{ marginTop: '1rem' }}>
            {items.map((item) => (
              <div className="upload-row" key={item.id}>
                <img src={item.previewUrl} alt="" />
                <div className="upload-row-main">
                  <input
                    placeholder="Title (optional)"
                    value={item.title}
                    onChange={(e) => setTitle(item.id, e.target.value)}
                    disabled={item.status === 'uploading' || item.status === 'done'}
                  />
                  {item.status === 'error' && <span className="error-text">{item.error}</span>}
                </div>
                <span className={`upload-status ${item.status}`}>
                  {item.status === 'pending' && 'Ready'}
                  {item.status === 'uploading' && 'Uploading…'}
                  {item.status === 'done' && 'Done'}
                  {item.status === 'error' && 'Failed'}
                </span>
                {item.status !== 'uploading' && item.status !== 'done' && (
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 26, height: 26 }}
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={uploading}>
            {allDone ? 'Close' : 'Cancel'}
          </button>
          {!allDone && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={startUpload}
              disabled={uploading || items.length === 0 || !categoryId}
            >
              {uploading ? 'Uploading…' : `Upload ${items.length || ''}`.trim()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
