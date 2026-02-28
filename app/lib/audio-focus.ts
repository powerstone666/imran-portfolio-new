const AUDIO_FOCUS_EVENT = "imran-portfolio:audio-focus";

type AudioFocusDetail = {
  owner?: HTMLMediaElement;
};

export function requestAudioFocus(owner: HTMLMediaElement): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<AudioFocusDetail>(AUDIO_FOCUS_EVENT, {
      detail: { owner },
    }),
  );
}

export function subscribeToAudioFocus(
  target: HTMLMediaElement,
  onFocusLost?: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onFocusRequested = (event: Event) => {
    const owner = (event as CustomEvent<AudioFocusDetail>).detail?.owner;
    if (!owner || owner === target) {
      return;
    }

    if (!target.paused) {
      target.pause();
      onFocusLost?.();
    }
  };

  window.addEventListener(AUDIO_FOCUS_EVENT, onFocusRequested);
  return () => {
    window.removeEventListener(AUDIO_FOCUS_EVENT, onFocusRequested);
  };
}
