import { useCallback, useEffect, useState } from 'react';
import { LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchAdminPortfolio,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  updateImage,
  deleteImage,
  reorderImages,
  friendlyError,
} from '../lib/api.js';
import CategoryPanel from '../components/admin/CategoryPanel.jsx';
import ImagePanel from '../components/admin/ImagePanel.jsx';
import CategoryModal from '../components/admin/CategoryModal.jsx';
import ImageEditModal from '../components/admin/ImageEditModal.jsx';
import UploadModal from '../components/admin/UploadModal.jsx';
import ConfirmDialog from '../components/admin/ConfirmDialog.jsx';
import '../styles/admin.css';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [categoryModal, setCategoryModal] = useState(null); // null | 'new' | category
  const [imageModal, setImageModal] = useState(null); // image | null
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { kind, item } | null
  const [confirmBusy, setConfirmBusy] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await fetchAdminPortfolio();
      setCategories(data);
      setSelectedId((prev) => (data.some((c) => c.id === prev) ? prev : data[0]?.id ?? null));
      setStatus('ready');
    } catch (err) {
      setError(friendlyError(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = categories.find((c) => c.id === selectedId) ?? null;

  /* ------------------------------ categories ------------------------------ */

  const handleSaveCategory = async (values) => {
    if (categoryModal === 'new') {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.display_order), 0);
      const created = await createCategory({ ...values, display_order: maxOrder + 1 });
      setCategories((prev) => [...prev, { ...created, images: [] }]);
      setSelectedId(created.id);
    } else {
      const updated = await updateCategory(categoryModal.id, values);
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    }
    setCategoryModal(null);
  };

  const handleReorderCategories = async (orderedIds) => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    setCategories(orderedIds.map((id, i) => ({ ...byId.get(id), display_order: i + 1 })));
    try {
      await reorderCategories(orderedIds);
    } catch (err) {
      setError(friendlyError(err));
      load();
    }
  };

  /* ------------------------------ images ------------------------------ */

  const handleSaveImage = async (values) => {
    const updated = await updateImage(imageModal.id, values);
    setCategories((prev) =>
      prev.map((c) =>
        c.id !== updated.category_id
          ? c
          : { ...c, images: c.images.map((i) => (i.id === updated.id ? updated : i)) }
      )
    );
    setImageModal(null);
  };

  const handleReorderImages = async (orderedIds) => {
    const byId = new Map(selected.images.map((i) => [i.id, i]));
    const reordered = orderedIds.map((id, i) => ({ ...byId.get(id), display_order: i + 1 }));
    setCategories((prev) => prev.map((c) => (c.id === selected.id ? { ...c, images: reordered } : c)));
    try {
      await reorderImages(orderedIds);
    } catch (err) {
      setError(friendlyError(err));
      load();
    }
  };

  const handleUploaded = (image) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === image.category_id ? { ...c, images: [...c.images, image] } : c))
    );
  };

  /* ------------------------------ delete (shared confirm) ------------------------------ */

  const runDelete = async () => {
    if (!confirmTarget) return;
    setConfirmBusy(true);
    try {
      if (confirmTarget.kind === 'category') {
        await deleteCategory(confirmTarget.item);
        setCategories((prev) => prev.filter((c) => c.id !== confirmTarget.item.id));
        setSelectedId((prev) => (prev === confirmTarget.item.id ? null : prev));
      } else {
        await deleteImage(confirmTarget.item);
        setCategories((prev) =>
          prev.map((c) =>
            c.id !== confirmTarget.item.category_id
              ? c
              : { ...c, images: c.images.filter((i) => i.id !== confirmTarget.item.id) }
          )
        );
      }
      setConfirmTarget(null);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setConfirmBusy(false);
    }
  };

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <h1>Gallery admin</h1>
        <div className="admin-topbar-actions">
          <a href="/" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            <ExternalLink size={14} /> View site
          </a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>

      <div className="admin-body">
        {error && <div className="banner banner-error" style={{ gridColumn: '1 / -1' }}>{error}</div>}

        {status === 'loading' && <p className="admin-empty" style={{ gridColumn: '1 / -1' }}>Loading…</p>}

        {status === 'error' && !categories.length ? null : status !== 'loading' && (
          <>
            <CategoryPanel
              categories={categories}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onCreate={() => setCategoryModal('new')}
              onEdit={(cat) => setCategoryModal(cat)}
              onDelete={(cat) => setConfirmTarget({ kind: 'category', item: cat })}
              onReorder={handleReorderCategories}
            />
            <ImagePanel
              category={selected}
              onUpload={() => setUploadOpen(true)}
              onEdit={(img) => setImageModal(img)}
              onDelete={(img) => setConfirmTarget({ kind: 'image', item: img })}
              onReorder={handleReorderImages}
            />
          </>
        )}
      </div>

      {categoryModal && (
        <CategoryModal
          initial={categoryModal === 'new' ? null : categoryModal}
          onSave={handleSaveCategory}
          onClose={() => setCategoryModal(null)}
        />
      )}

      {imageModal && (
        <ImageEditModal image={imageModal} onSave={handleSaveImage} onClose={() => setImageModal(null)} />
      )}

      {uploadOpen && (
        <UploadModal
          categories={categories}
          defaultCategoryId={selectedId}
          onUploaded={handleUploaded}
          onClose={() => setUploadOpen(false)}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title={confirmTarget.kind === 'category' ? 'Delete category?' : 'Delete photograph?'}
          message={
            confirmTarget.kind === 'category'
              ? `"${confirmTarget.item.name}" and all ${confirmTarget.item.images.length} photograph(s) in it will be permanently deleted.`
              : 'This photograph will be permanently deleted.'
          }
          onConfirm={runDelete}
          onCancel={() => setConfirmTarget(null)}
          busy={confirmBusy}
        />
      )}
    </div>
  );
}
