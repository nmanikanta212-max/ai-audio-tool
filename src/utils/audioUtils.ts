/**
 * Converts a base64 encoded audio string to an HTML5 Audio object URL
 */
export function base64ToBlobUrl(base64: string, mimeType = 'audio/wav'): string {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Triggers a download of base64 audio data as a .wav file
 */
export function downloadBase64Audio(base64: string, filename = 'voxinfinite-audio.wav', mimeType = 'audio/wav') {
  const url = base64ToBlobUrl(base64, mimeType);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename.endsWith('.wav') ? filename : `${filename}.wav`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Estimates reading / audio duration based on word count (avg ~140 wpm for natural dialogue)
 */
export function estimateDuration(text: string): number {
  if (!text) return 0;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(2, Math.round((wordCount / 140) * 60));
}

/**
 * Extracts and cleans raw audio buffer duration from a Blob URL
 */
export async function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration || 0);
    });
    audio.addEventListener('error', () => {
      resolve(0);
    });
    audio.src = url;
  });
}
