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

  const transforms = ['f_auto', 'q_auto', 'c_limit', `w_${Math.round(width)}`];
  const t = transforms.join(',');

  if (isCloudinaryUploadUrl(originalUrl)) {
    if (/\/image\/upload\/[^/]*f_auto/.test(originalUrl)) {
      // Already transformed — ensure width is present.
      if (!/\/w_\d+/.test(originalUrl)) {
        return originalUrl.replace(/\/image\/upload\/([^/]+)\//, (_m, existing) => {
          return `/image/upload/${existing},w_${Math.round(width)}/`;
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
