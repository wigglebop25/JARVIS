import { useState, useEffect } from 'react';
import { mediaControls, PlaybackStatus, getMetadata, getPlaybackInfo, isEnabled, getPlaybackStatus, getPosition } from 'tauri-plugin-media-api';

interface PlaybackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  coverArt?: string;
}

interface PlaybackInfoResult {
  isPlaying?: boolean;
  progress?: number;
  source?: string;
}

interface UseMediaSessionReturn {
  isPlaying: boolean;
  trackTitle: string;
  trackArtist: string;
  trackProgress: number;
  trackDuration: number;
  coverArt: string | null;
  isMediaSupported: boolean;
  hasActiveMedia: boolean;
  mediaSource: string;
  togglePlayPause: () => void;
}

export const useMediaSession = (): UseMediaSessionReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackTitle, setTrackTitle] = useState('Station Calibration');
  const [trackArtist, setTrackArtist] = useState('Neural Network');
  const [trackProgress, setTrackProgress] = useState(105);
  const [trackDuration, setTrackDuration] = useState(200);
  const [mediaSource, setMediaSource] = useState('Spotify');
  const [isMediaSupported, setIsMediaSupported] = useState(false);
  const [hasActiveMedia, setHasActiveMedia] = useState(false);
  const [coverArt, setCoverArt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const initAndCheckSupport = async () => {
      try {
        await mediaControls.initialize('jarvis', 'JARVIS Media');
        const supported = await isEnabled();
        if (active) setIsMediaSupported(supported);
      } catch (err: unknown) {
        console.warn('Media controls not supported or outside Tauri environment:', err);
        if (active) setIsMediaSupported(false);
      }
    };
    initAndCheckSupport();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    if (isMediaSupported) {
      const interval = setInterval(async () => {
        try {
          let metadata: PlaybackMetadata | null = null;
          try {
            const md = await getMetadata();
            if (md && typeof md === 'object') metadata = md as unknown as PlaybackMetadata;
          } catch (e: unknown) { console.warn('getMetadata failed:', e); }

          let info: PlaybackInfoResult | null = null;
          try {
            const inf = await getPlaybackInfo();
            if (inf && typeof inf === 'object') info = inf as unknown as PlaybackInfoResult;
          } catch (e: unknown) {
            const errMsg = String(e);
            if (!errMsg.includes('0x00000000') && !errMsg.includes('completed successfully')) {
              console.warn('getPlaybackInfo failed:', e);
            }
          }

          if (!active) return;

          let statusVal = PlaybackStatus.Stopped;
          let posVal = 0;
          try { statusVal = await getPlaybackStatus(); } catch { /* fallback */ }
          try { posVal = await getPosition(); } catch { /* fallback */ }

          if (metadata) {
            if (metadata.title) setTrackTitle(metadata.title);
            if (metadata.artist) setTrackArtist(metadata.artist);
            if (metadata.album) setMediaSource(metadata.album);
            if (metadata.duration) setTrackDuration(Math.round(metadata.duration));
            if (metadata.coverArt) setCoverArt(metadata.coverArt);
          }

          if (info) {
            if (typeof info.isPlaying === 'boolean') setIsPlaying(info.isPlaying);
            if (typeof info.progress === 'number') setTrackProgress(Math.round(info.progress));
            if (info.source) setMediaSource(info.source);
            setHasActiveMedia(true);
          } else {
            setHasActiveMedia(false);
            setCoverArt(null);
          }

          if (statusVal === PlaybackStatus.Playing) setIsPlaying(true);
          else if (statusVal === PlaybackStatus.Paused) setIsPlaying(false);

          if (posVal > 0) setTrackProgress(Math.round(posVal));

          if (!metadata && statusVal === PlaybackStatus.Stopped) {
            setHasActiveMedia(false);
            setCoverArt(null);
          }
        } catch (err: unknown) {
          const errMsg = String(err);
          if (!errMsg.includes('0x00000000') && !errMsg.includes('completed successfully')) {
            console.warn('Media polling error:', err);
          }
        }
      }, 1000);
      return () => { active = false; clearInterval(interval); };
    }

    const fallbackInterval = setInterval(() => {
      setHasActiveMedia(true);
      setTrackProgress(prev => {
        if (isPlaying) return prev >= trackDuration ? 0 : prev + 1;
        return prev;
      });
    }, 1000);
    return () => { active = false; clearInterval(fallbackInterval); };
  }, [isMediaSupported, isPlaying, trackDuration]);

  const togglePlayPause = async () => {
    try {
      if (isPlaying) await mediaControls.pause();
      else await mediaControls.play();
      setIsPlaying(!isPlaying);
    } catch (err: unknown) {
      console.warn('Toggle play/pause failed:', err);
    }
  };

  return {
    isPlaying, trackTitle, trackArtist, trackProgress, trackDuration,
    coverArt, isMediaSupported, hasActiveMedia, mediaSource, togglePlayPause,
  };
};
