import { ChevronDown } from 'lucide-react';
import PhotoThumb from './PhotoThumb.jsx';
import { useReveal } from '../hooks/useReveal.js';

export default function CategorySection({ category, isOpen, onToggle, onOpenImage }) {
  const [ref, visible] = useReveal();
  const count = category.images.length;

  return (
    <div className={`category reveal${visible ? ' is-visible' : ''}`} ref={ref}>
      <button
        type="button"
        className="category-head"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="category-head-text">
          <h3>
            {category.name}
            <span className="category-count">
              {count} {count === 1 ? 'photograph' : 'photographs'}
            </span>
          </h3>
          {category.description && <p className="category-description">{category.description}</p>}
        </div>
        <span className={`category-toggle${isOpen ? ' is-open' : ''}`}>
          {isOpen ? 'Collapse' : 'Expand'}
          <ChevronDown size={18} />
        </span>
      </button>

      <div className={`category-body${isOpen ? ' is-open' : ''}`}>
        <div className="category-body-inner">
          {count === 0 ? (
            <p className="category-empty">No photographs in this collection yet.</p>
          ) : (
            <div className="masonry">
              {category.images.map((img, i) => (
                <PhotoThumb key={img.id} image={img} onOpen={() => onOpenImage(category, i)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
