/**
 * Extracts the YouTube video ID from various YouTube URL formats.
 * @param url The YouTube video URL
 * @returns The video ID or null if not found
 */
export const getYouTubeID = (url: string): string | null => {
    if (!url) return null;
    
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
        return match[2];
    }
    
    return null;
};
