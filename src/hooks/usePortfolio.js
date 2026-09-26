import { useCallback, useEffect, useState } from 'react';
import { fetchPublicPortfolio, friendlyError } from '../lib/api.js';

// Module-level cache: the data is fetched once per page load and reused if the
// component remounts, so we never refetch unnecessarily.
let cache = null;
let inflight = null;

function load(force) {
  if (cache && !force) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetchPublicPortfolio()
      .then((data) => {
        cache = data;
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function usePortfolio() {
  const [state, setState] = useState(
    cache ? { status: 'ready', data: cache, error: '' } : { status: 'loading', data: [], error: '' }
  );

  const run = useCallback((force = false) => {
    let active = true;
    setState((s) => (s.status === 'ready' && !force ? s : { status: 'loading', data: [], error: '' }));
    load(force)
      .then((data) => active && setState({ status: 'ready', data, error: '' }))
      .catch((err) => active && setState({ status: 'error', data: [], error: friendlyError(err) }));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => run(false), [run]);

  return { ...state, reload: () => run(true) };
}
