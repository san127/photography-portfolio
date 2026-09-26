import { GripVertical, Pencil, Trash2, Plus, EyeOff } from 'lucide-react';
import { useDragReorder } from '../../hooks/useDragReorder.js';

export default function CategoryPanel({
  categories,
  selectedId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onReorder,
}) {
  const { current, dragId, getHandlers } = useDragReorder(categories, (order) => onReorder(order));

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Categories</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={onCreate}>
          <Plus size={15} /> New
        </button>
      </div>

      {current.length === 0 ? (
        <p className="admin-empty">No categories yet — create your first one.</p>
      ) : (
        <ul className="category-list">
          {current.map((cat) => (
            <li
              key={cat.id}
              className={`category-row${selectedId === cat.id ? ' is-selected' : ''}${
                dragId === cat.id ? ' is-dragging' : ''
              }${!cat.is_published ? ' is-hidden' : ''}`}
              {...getHandlers(cat.id)}
            >
              <span className="drag-handle" aria-hidden="true">
                <GripVertical size={16} />
              </span>
              <button type="button" className="category-row-main" onClick={() => onSelect(cat.id)}>
                <strong>{cat.name}</strong>
                <small>
                  {cat.images.length} photo{cat.images.length === 1 ? '' : 's'}
                  {!cat.is_published && (
                    <>
                      {' '}
                      · <EyeOff size={11} style={{ verticalAlign: -1 }} /> hidden
                    </>
                  )}
                </small>
              </button>
              <div className="row-actions">
                <button type="button" onClick={() => onEdit(cat)} aria-label={`Edit ${cat.name}`}>
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => onDelete(cat)} aria-label={`Delete ${cat.name}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
