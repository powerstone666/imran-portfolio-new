"use client";

type LetterboxBarsProps = {
  isAwaiting: boolean;
};

export default function LetterboxBars({ isAwaiting: _isAwaiting }: LetterboxBarsProps) {
  return (
    <>
      <div className="cine-letterbox cine-letterbox-top" aria-hidden="true" />
      <div className="cine-letterbox cine-letterbox-bottom" aria-hidden="true" />
    </>
  );
}
