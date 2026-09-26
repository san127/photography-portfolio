import { useState } from 'react';
import { Maximize2, ImageOff } from 'lucide-react';

export default function PhotoThumb({ image, onOpen }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ratio = image.width && image.height ? image.width / image.height : null;

  if (failed) {
    return (
      <div className="masonry-item" style={ratio ? { aspectRatio: ratio } : undefined}>
        <div
          className="masonry-item-overlay"
          style={{ opacity: 1, background: 'var(--beige)', alignItems: 'center', justifyContent: 'center' }}
        >
          <ImageOff size={22} color="var(--ink-soft)" />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`masonry-item${!loaded ? ' is-loading' : ''}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      onClick={onOpen}
      aria-label={image.title ? `Open photo: ${image.title}` : 'Open photo'}
    >
      {!loaded && <div className="skeleton" />}
      <img
        src={image.thumb_url || image.image_url}
        alt={image.title || ''}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 260ms ease' }}
      />
      {loaded && (
        <div className="masonry-item-overlay">
          <span className="expand-icon">
            <Maximize2 size={15} />
          </span>
          {image.title && <span className="masonry-item-caption">{image.title}</span>}
        </div>
      )}
    </button>
  );
}
