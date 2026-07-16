// Cloudinary delivery helpers for React Native.
// DB stores native Cloudinary upload URLs; we inject f_auto/q_auto/c_limit + width
// so mobile never downloads multi‑MB originals.

const CLOUD_NAME =
  (process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'vpagrbf4').trim();

export function isCloudinaryUploadUrl(src?: string | null): boolean {
  if (!src) return false;
  try {
    const u = new URL(src);
    return u.hostname === 'res.cloudinary.com' && u.pathname.includes('/image/upload/');
  } catch {
    return false;
  }
}

/** Optimize a remote image URL for display at ~`width` CSS pixels. */
export function optimizeImageUrl(
  originalUrl?: string | null,
  width = 600,
): string | undefined {
  if (!originalUrl) return undefined;
  if (!CLOUD_NAME) return originalUrl;

  // Clamp width to reasonable bounds for mobile
  const w = Math.round(Math.min(Math.max(width, 80), 1200));

  const transforms = ['f_auto', 'q_auto:best', 'c_limit', `w_${w}`];
  const t = transforms.join(',');

  if (isCloudinaryUploadUrl(originalUrl)) {
    if (/\/image\/upload\/[^/]*f_auto/.test(originalUrl)) {
      // Already transformed — ensure width is present.
      if (!/\/w_\d+/.test(originalUrl)) {
        return originalUrl.replace(/\/image\/upload\/([^/]+)\//, (_m, existing) => {
          return `/image/upload/${existing},w_${w}/`;
        });
      }
      return originalUrl;
    }
    return originalUrl.replace('/image/upload/', `/image/upload/${t}/`);
  }

  // External / legacy Supabase URLs: pull via Cloudinary Fetch.
  if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${t}/${encodeURIComponent(originalUrl)}`;
  }

  return originalUrl;
}

/**
 * Batch-prefetch multiple image URLs into the expo-image cache.
 * Call this when a screen mounts to warm the cache before images scroll into view.
 */
export function prefetchImages(urls: (string | undefined | null)[], width = 400): void {
  // Lazy import to avoid circular deps in some bundler configs
  import('expo-image')
    .then(({ Image: ExpoImage }) => {
      const optimized = urls
        .filter(Boolean)
        .map((u) => optimizeImageUrl(u, width))
        .filter(Boolean) as string[];
      optimized.forEach((u) => {
        ExpoImage.prefetch(u).catch(() => {});
      });
    })
    .catch(() => {});
}
