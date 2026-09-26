import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/lightbox.css';

const SWIPE_THRESHOLD = 50;

export default function Lightbox({ images, index, onClose, onNavigate }) {
  const [closing, setClosing] = useState(false);
  const touchStart = useRef(null);
  const image = images[index];

  const requestClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 170);
  }, [onClose]);

  const next = useCallback(() => onNavigate((index + 1) % images.length), [index, images.length, onNavigate]);
  const prev = useCallback(
    () => onNavigate((index - 1 + images.length) % images.length),
    [index, images.length, onNavigate]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [requestClose, next, prev]);

  if (!image) return null;

  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) (delta > 0 ? prev() : next());
    touchStart.current = null;
  };

  return (
    <div
      className={`lightbox${closing ? ' is-closing' : ''}`}
      onClick={(e) => e.target === e.currentTarget && requestClose()}
      role="dialog"
      aria-modal="true"
      aria-label={image.title || 'Photograph viewer'}
    >
      <button type="button" className="lightbox-close" onClick={requestClose} aria-label="Close">
        <X size={20} />
      </button>

      {images.length > 1 && (
        <>
          <button type="button" className="lightbox-nav prev" onClick={prev} aria-label="Previous photograph">
            <ChevronLeft size={22} />
          </button>
          <button type="button" className="lightbox-nav next" onClick={next} aria-label="Next photograph">
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <figure className="lightbox-figure" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img src={image.image_url} alt={image.title || ''} className="lightbox-img" draggable={false} />
        {(image.title || image.description) && (
          <figcaption className="lightbox-caption">
            {image.title && <strong>{image.title}</strong>}
            {image.description && <span>{image.description}</span>}
          </figcaption>
        )}
      </figure>

      {images.length > 1 && (
        <div className="lightbox-counter">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
