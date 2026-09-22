/**
 * Thin server wrapper so this route is rendered per request by a function rather
 * than served as a pre-rendered HTML file.
 *
 * Vercel attaches `Content-Disposition: inline; filename="<path>"` when it serves a
 * static HTML file. Corporate web proxies read that header as a file transfer and
 * block the page under their download policy — which is what happened on
 * Rolls-Royce managed laptops. Function-rendered responses carry no such header,
 * and these screens are live per-session UIs that were never worth caching anyway.
 */
export const dynamic = 'force-dynamic';

import PlayClient from './PlayClient';

export default function Page() {
  return <PlayClient />;
}
