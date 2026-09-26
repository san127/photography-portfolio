import { GripVertical, Pencil, Trash2, UploadCloud, EyeOff } from 'lucide-react';
import { useDragReorder } from '../../hooks/useDragReorder.js';

export default function ImagePanel({ category, onUpload, onEdit, onDelete, onReorder }) {
  const { current, dragId, getHandlers } = useDragReorder(category?.images ?? [], (order) => onReorder(order));

  if (!category) {
    return (
      <div className="admin-panel">
        <p className="admin-empty">Select a category on the left to manage its photographs.</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>{category.name}</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={onUpload}>
          <UploadCloud size={15} /> Upload photos
        </button>
      </div>

      {current.length === 0 ? (
        <p className="admin-empty">No photographs in this collection yet.</p>
      ) : (
        <div className="image-grid">
          {current.map((img) => (
            <div
              key={img.id}
              className={`image-card${dragId === img.id ? ' is-dragging' : ''}${
                !img.is_published ? ' is-hidden' : ''
              }`}
              {...getHandlers(img.id)}
            >
              <div className="image-card-media">
                <img src={img.thumb_url || img.image_url} alt={img.title || ''} />
                <span className="drag-handle">
                  <GripVertical size={14} />
                </span>
              </div>
              <div className="image-card-body">
                <span className="image-card-title">
                  {img.title || <em style={{ color: 'var(--ink-soft)' }}>Untitled</em>}
                  {!img.is_published && <EyeOff size={12} style={{ marginLeft: 5, verticalAlign: -1 }} />}
                </span>
                <div className="image-card-actions">
                  <button type="button" onClick={() => onEdit(img)} aria-label="Edit photograph">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => onDelete(img)} aria-label="Delete photograph">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
