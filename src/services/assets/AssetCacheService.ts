/**
 * AssetCacheService
 *
 * Manages local caching of remote story assets (images and audio).
 * Downloads remote URLs to device cache directory and provides local file paths.
 */

import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIR = (FileSystem.cacheDirectory || '') + 'moontales_stories/';

// Ensure cache directory exists and remove legacy colliding files
async function ensureCacheDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  } else {
    // Delete legacy collided cache files from prior bug
    for (const badFile of ['imagepng.png', 'audiomp3.mp3', 'image.png', 'audio.mp3']) {
      try {
        const p = CACHE_DIR + badFile;
        const info = await FileSystem.getInfoAsync(p);
        if (info.exists) {
          await FileSystem.deleteAsync(p, { idempotent: true });
        }
      } catch {}
    }
  }
}

// Generate a unique filename from URL that preserves the story ID and page number
function getFilenameFromUrl(url: string, type: 'image' | 'audio'): string {
  if (!url) return `asset_${Date.now()}.${type === 'image' ? 'png' : 'mp3'}`;

  // Strip query parameters
  const pathname = url.split('?')[0];

  // Match /stories/<story_id>/page_<page_number>/...
  const match = pathname.match(/stories\/([^/]+)\/page_(\d+)/i);
  let prefix = '';
  if (match) {
    const [, storyId, pageNum] = match;
    prefix = `story_${storyId.slice(0, 8)}_p${pageNum}`;
  } else {
    // Fallback: sanitized path
    const parts = pathname.split('/').filter(Boolean);
    prefix = parts.slice(-3).join('_').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  // Hash pathname for collision safety
  let hash = 0;
  for (let i = 0; i < pathname.length; i++) {
    hash = (hash << 5) - hash + pathname.charCodeAt(i);
    hash |= 0;
  }
  const hashStr = Math.abs(hash).toString(36);

  return `${prefix}_${type}_${hashStr}.${type === 'image' ? 'png' : 'mp3'}`;
}

/**
 * Download a remote asset to local cache
 * @param url Remote URL (signed GCS URL)
 * @param type Asset type ('image' or 'audio')
 * @returns Local file path
 */
export async function downloadAsset(
  url: string,
  type: 'image' | 'audio'
): Promise<string> {
  await ensureCacheDir();
  
  const filename = getFilenameFromUrl(url, type);
  const localPath = CACHE_DIR + filename;
  
  // Check if already cached
  const fileInfo = await FileSystem.getInfoAsync(localPath);
  if (fileInfo.exists) {
    return localPath;
  }
  
  // Download the file
  const downloadResult = await FileSystem.downloadAsync(url, localPath);
  
  if (downloadResult.status !== 200) {
    throw new Error(`Failed to download ${type}: ${url}`);
  }
  
  return localPath;
}

/**
 * Download all assets for a story (all pages' images and audio)
 * @param story Story object with pages containing remote URLs
 * @param onProgress Optional callback for progress updates (0-1)
 * @returns Story object with local file paths
 */
export async function cacheStoryAssets(
  story: any,
  onProgress?: (progress: number) => void
): Promise<any> {
  if (!story.pages || story.pages.length === 0) {
    return story;
  }
  
  await ensureCacheDir();
  
  const totalPages = story.pages.length;
  let processedPages = 0;
  
  const cachedPages = await Promise.all(
    story.pages.map(async (page: any) => {
      try {
        // Download image
        const localImagePath = await downloadAsset(page.image_url, 'image');
        
        // Download audio
        const localAudioPath = await downloadAsset(page.audio_url, 'audio');
        
        processedPages++;
        if (onProgress) {
          onProgress(processedPages / totalPages);
        }
        
        return {
          ...page,
          local_image_path: localImagePath,
          local_audio_path: localAudioPath,
        };
      } catch (error) {
        console.error(`Failed to cache assets for page ${page.page_number}:`, error);
        // Return original page if download fails
        return page;
      }
    })
  );
  
  return {
    ...story,
    pages: cachedPages,
  };
}

/**
 * Clear all cached assets (useful for storage management)
 */
export async function clearCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await ensureCacheDir();
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

/**
 * Get cache size in bytes
 */
export async function getCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) return 0;
    
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = CACHE_DIR + file;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += fileInfo.size || 0;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return 0;
  }
}