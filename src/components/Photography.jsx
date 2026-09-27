import { useMemo, useState } from 'react';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { useSessionState } from '../hooks/useSessionState.js';
import CategorySection from './CategorySection.jsx';
import Lightbox from './Lightbox.jsx';
import '../styles/gallery.css';

function CategorySkeleton() {
  return (
    <div className="category">
      <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 14 }} />
      <div className="masonry">
        {[220, 300, 180, 260].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, marginBottom: 14, breakInside: 'avoid' }} />
        ))}
      </div>
    </div>
  );
}

export default function Photography() {
  const { status, data, error, reload } = usePortfolio();
  const [openMap, setOpenMap] = useSessionState('portfolio:open-categories', {});
  const [viewer, setViewer] = useState(null); // { images, index }

  const initialisedIds = useMemo(() => new Set(Object.keys(openMap)), [openMap]);

  const isOpen = (cat) => (initialisedIds.has(cat.id) ? Boolean(openMap[cat.id]) : true);

  const toggle = (cat) =>
    setOpenMap((prev) => ({ ...prev, [cat.id]: !isOpen(cat) }));

  const openImage = (category, i) => setViewer({ images: category.images, index: i });

  return (
    <section id="photography" className="section">
      <div className="container">
        {/* <div className="photography-header">
          <p className="eyebrow-label">Photography</p>
          <h2>A collection, in progress</h2>
          <p>Organised by mood and light, rather than by date.</p>
        </div> */}

        {status === 'loading' && (
          <>
            <CategorySkeleton />
            <CategorySkeleton />
          </>
        )}

        {status === 'error' && (
          <div className="state-block">
            <h3>Couldn't load the gallery</h3>
            <p>{error}</p>
            <button type="button" className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={reload}>
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && data.length === 0 && (
          <div className="state-block">
            <h3>Nothing here yet.</h3>
            <p>New photographs will appear here soon.</p>
          </div>
        )}

        {status === 'ready' &&
          data.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              isOpen={isOpen(category)}
              onToggle={() => toggle(category)}
              onOpenImage={openImage}
            />
          ))}
      </div>

      {viewer && (
        <Lightbox
          images={viewer.images}
          index={viewer.index}
          onNavigate={(i) => setViewer((v) => ({ ...v, index: i }))}
          onClose={() => setViewer(null)}
        />
      )}
    </section>
  );
}
