import { useParams } from 'react-router-dom';

/**
 * Returns a function to build org-scoped paths for public pages.
 * When inside /org/:orgSlug/*, it prefixes paths with /org/:orgSlug.
 * When outside (fallback), returns paths as-is.
 */
export function useOrgPath() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  return (path: string) => {
    if (!orgSlug) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/org/${orgSlug}${cleanPath}`;
  };
}
