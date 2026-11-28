"use client";

import { useState, useRef, useEffect } from "react";

export function HeroVideoShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isManuallyPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Auto-pause when scrolled out of view; auto-resume when in view (unless manually paused)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (!isManuallyPausedRef.current) {
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      isManuallyPausedRef.current = false;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      isManuallyPausedRef.current = true;
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    isManuallyPausedRef.current = false;
    video.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Ambient glow behind the showcase frame */}
      <div
        className="absolute -inset-1 sm:-inset-2 rounded-3xl bg-gradient-to-r from-orange-500/20 via-indigo-500/20 to-emerald-500/20 blur-2xl opacity-70 dark:opacity-40 pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Video Container Frame */}
      <div
        data-gsap="video-showcase"
        onClick={togglePlay}
        className="group relative aspect-video w-full rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-[#0b0d12] shadow-2xl shadow-zinc-950/20 dark:shadow-black/80 overflow-hidden cursor-pointer select-none"
        role="region"
        aria-label="IndieBill 30-Second Product Walkthrough"
      >
        <video
          ref={videoRef}
          src="/videos/indiebill-promo.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover rounded-2xl bg-[#0b0d12]"
        />

        {/* Top-left subtle badge */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 dark:bg-black/75 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md border border-white/10 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
            Product Walkthrough
          </span>
        </div>

        {/* Centered Play overlay when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px] transition-opacity duration-200 z-10 pointer-events-none">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-2xl transition-transform group-hover:scale-105">
              <svg className="h-6 w-6 sm:h-7 sm:w-7 fill-current translate-x-0.5" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>
        )}

        {/* Floating Glassmorphic Custom Controls (Bottom-Right) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex items-center gap-1 sm:gap-1.5 rounded-full bg-black/65 dark:bg-black/80 p-1.5 backdrop-blur-md border border-white/15 text-white shadow-xl opacity-90 group-hover:opacity-100 transition-opacity"
        >
          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            title={isPlaying ? "Pause" : "Play"}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="h-4 w-4 fill-current translate-x-0.5" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Mute / Unmute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            title={isMuted ? "Unmute" : "Mute"}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            {isMuted ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          {/* Replay Button */}
          <button
            type="button"
            onClick={handleReplay}
            aria-label="Replay video"
            title="Replay from start"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
