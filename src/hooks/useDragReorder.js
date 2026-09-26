import { useRef, useState } from 'react';

// Native HTML5 drag-and-drop reordering for a flat list.
// onCommit(newOrderArray) fires once, on drop, with the full reordered array.
export function useDragReorder(items, onCommit) {
  const [dragId, setDragId] = useState(null);
  const [list, setList] = useState(items);
  const liveRef = useRef(items);
  liveRef.current = items;

  const current = dragId === null ? items : list;

  const getHandlers = (id) => ({
    draggable: true,
    onDragStart: (e) => {
      setDragId(id);
      setList(items);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e) => {
      e.preventDefault();
      if (dragId === null || dragId === id) return;
      setList((prev) => {
        const from = prev.findIndex((i) => i.id === dragId);
        const to = prev.findIndex((i) => i.id === id);
        if (from === -1 || to === -1 || from === to) return prev;
        const copy = prev.slice();
        const [moved] = copy.splice(from, 1);
        copy.splice(to, 0, moved);
        return copy;
      });
    },
    onDrop: (e) => {
      e.preventDefault();
      finish();
    },
    onDragEnd: () => finish(),
  });

  function finish() {
    if (dragId !== null) {
      const order = list.map((i) => i.id);
      const original = liveRef.current.map((i) => i.id);
      if (JSON.stringify(order) !== JSON.stringify(original)) onCommit(order, list);
    }
    setDragId(null);
  }

  return { current, dragId, getHandlers };
}
