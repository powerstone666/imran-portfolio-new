const DATA_URL_PREFIX = "data:";
const BASE64_MARKER = ";base64,";
const DEFAULT_PLAYBACK_MIME_TYPE = "audio/mpeg";

export function extractAudioDataUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith(DATA_URL_PREFIX)) {
    return trimmed;
  }

  return `data:${DEFAULT_PLAYBACK_MIME_TYPE};base64,${trimmed}`;
}

export function createObjectUrlFromAudioDataUrl(audioDataUrl: string): string | null {
  if (!audioDataUrl.startsWith(DATA_URL_PREFIX)) {
    return null;
  }

  const separatorIndex = audioDataUrl.indexOf(BASE64_MARKER);
  if (separatorIndex < 0) {
    return null;
  }

  const metadata = audioDataUrl.slice(DATA_URL_PREFIX.length, separatorIndex);
  const mimeType = metadata || DEFAULT_PLAYBACK_MIME_TYPE;
  const base64Payload = audioDataUrl.slice(separatorIndex + BASE64_MARKER.length);

  try {
    const binaryString = atob(base64Payload);
    const byteArray = new Uint8Array(binaryString.length);
    for (let index = 0; index < binaryString.length; index += 1) {
      byteArray[index] = binaryString.charCodeAt(index);
    }

    const audioBlob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error("Unable to decode assistant audio payload.", error);
    return null;
  }
}

export function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to encode recorded audio."));
    };
    reader.onerror = () => {
      reject(new Error("Unable to read recorded audio."));
    };
    reader.readAsDataURL(blob);
  });
}
