
import React, { useRef, useState, useEffect } from 'react';
import { TreeMorphState } from '../types';
import { Sparkles, Trees, RotateCcw, Upload, Images, X, Snowflake, Play, Pause, SkipForward, Music } from 'lucide-react';
import { CHRISTMAS_PLAYLIST } from '../constants';

interface UIProps {
  currentState: TreeMorphState;
  onToggleState: () => void;
  onUploadPhoto: (event: React.ChangeEvent<HTMLInputElement>) => void;
  photos: string[];
  isGalleryOpen: boolean;
  onToggleGallery: () => void;
  titleText: string;
  onTitleChange: (text: string) => void;
}

// --- Music Player Component ---
const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(CHRISTMAS_PLAYLIST[currentTrack].url);
    audioRef.current.volume = 0.4;
    
    const handleEnded = () => {
       playNext();
    };

    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      audioRef.current?.pause();
      audioRef.current?.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, []);

  // Handle track switching
  useEffect(() => {
    if (!audioRef.current) return;
    
    // If track changed (not initial mount)
    if (audioRef.current.src !== CHRISTMAS_PLAYLIST[currentTrack].url) {
        audioRef.current.src = CHRISTMAS_PLAYLIST[currentTrack].url;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Playback error:", e));
        }
    }
  }, [currentTrack]);

  // Handle Play/Pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.play().catch(e => {
            console.error("Auto-play blocked or error:", e);
            setIsPlaying(false);
        });
    } else {
        audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const playNext = () => {
    setCurrentTrack((prev) => (prev + 1) % CHRISTMAS_PLAYLIST.length);
  };

  return (
    <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
        {/* Track Info (Visible on hover or play) */}
        <div className={`
            hidden md:flex flex-col items-end text-right transition-opacity duration-500
            ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}>
            <span className="text-yellow-400 font-['Cinzel'] text-xs tracking-widest">Now Playing</span>
            <span className="text-white/80 font-['Playfair_Display'] text-sm italic truncate max-w-[150px]">
                {CHRISTMAS_PLAYLIST[currentTrack].title}
            </span>
        </div>

        {/* Snowflake Button */}
        <button 
            onClick={togglePlay}
            className={`
                group relative w-12 h-12 flex items-center justify-center rounded-full
                backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(255,215,0,0.2)]
                transition-all duration-300 hover:scale-110 hover:border-yellow-400/50
                ${isPlaying ? 'bg-yellow-900/20' : 'bg-black/20'}
            `}
            title="Play Christmas Music"
        >
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-full bg-yellow-400/20 blur-md transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
            
            {/* Rotating Snowflake */}
            <Snowflake 
                className={`
                    w-6 h-6 text-yellow-100 transition-all duration-[3000ms] linear
                    ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}
                `} 
            />
            
            {/* Tiny Play/Pause Overlay */}
            <div className="absolute bottom-0 right-0 bg-black/80 rounded-full p-1 border border-white/20">
                {isPlaying ? <Pause className="w-2 h-2 text-white" /> : <Play className="w-2 h-2 text-white" />}
            </div>
        </button>

        {/* Skip Button (Only visible when playing/hover) */}
        <button 
            onClick={playNext}
            className={`
                w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10
                border border-white/10 text-white/60 hover:text-white transition-all
                ${isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}
            `}
        >
            <SkipForward className="w-4 h-4" />
        </button>
    </div>
  );
};

// --- Gallery Slideshow Component ---
const GallerySlideshow: React.FC<{ photos: string[]; onClose: () => void; triggerUpload: () => void }> = ({ photos, onClose, triggerUpload }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-advance
    useEffect(() => {
        if (photos.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % photos.length);
        }, 4000); // 4 seconds per slide
        return () => clearInterval(interval);
    }, [photos.length]);

    if (photos.length === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-white/40 gap-6 animate-[fadeIn_0.5s_ease-out]">
                <Images className="w-16 h-16 opacity-20" />
                <p className="font-['Playfair_Display'] text-xl tracking-wide">No memories collected yet.</p>
                <div className="flex gap-4">
                     <button 
                        onClick={() => { onClose(); triggerUpload(); }}
                        className="px-8 py-3 border border-white/20 hover:bg-white/5 transition-colors text-white/80 hover:text-white font-['Cinzel'] tracking-widest text-sm"
                     >
                        Upload Memory
                     </button>
                     <button onClick={onClose} className="px-8 py-3 text-white/40 hover:text-white font-['Cinzel'] text-sm">Close</button>
                </div>
            </div>
        );
    }

    const currentPhoto = photos[currentIndex];

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col animate-[fadeIn_0.5s_ease-out]">
             {/* Controls Header */}
             <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                 <div className="flex flex-col">
                    <h2 className="text-2xl font-['Great_Vibes'] text-yellow-500">Memories in Motion</h2>
                    <p className="text-white/40 text-xs tracking-widest uppercase font-['Cinzel']">
                        {currentIndex + 1} / {photos.length}
                    </p>
                 </div>
                 <button 
                    onClick={onClose}
                    className="p-3 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                 >
                    <X className="w-8 h-8" />
                 </button>
             </div>

             {/* Main Slideshow */}
             <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
                 {/* Photo Frame */}
                 <div className="relative max-h-[80vh] aspect-[4/5] md:aspect-[3/4] shadow-[0_0_100px_rgba(255,215,0,0.1)] transition-all duration-1000">
                    
                    {/* Golden Frame Border */}
                    <div className="absolute -inset-1 rounded-sm bg-gradient-to-br from-[#fffcdb] via-[#fcd34d] to-[#b45309] opacity-100" />
                    
                    {/* The Image */}
                    <div className="relative h-full w-full bg-black overflow-hidden border-[8px] border-white">
                        {/* We use a key to force re-render animation on change, or manage opacity */}
                        <img 
                            key={currentPhoto}
                            src={currentPhoto} 
                            alt="Memory" 
                            className="w-full h-full object-cover animate-[zoomIn_6s_ease-out_forwards]"
                        />
                    </div>

                    {/* Polaroid Bottom Text Area (Simulated) */}
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-white translate-y-full flex items-center justify-center">
                        <span className="font-['Reenie_Beanie'] text-2xl text-gray-600">
                            Memory #{photos.length - currentIndex}
                        </span>
                    </div>
                 </div>

                 {/* Background Blur Clone for Ambiance */}
                 <div className="absolute inset-0 z-[-1] opacity-30 blur-[100px] scale-150 pointer-events-none">
                     <img src={currentPhoto} className="w-full h-full object-cover" alt="" />
                 </div>
             </div>

             {/* Progress Bar */}
             <div className="w-full h-1 bg-white/10">
                <div 
                    className="h-full bg-yellow-500 transition-all duration-500 ease-out" 
                    style={{ width: `${((currentIndex + 1) / photos.length) * 100}%` }} 
                />
             </div>
        </div>
    );
}

// --- Main UI ---

export const UI: React.FC<UIProps> = ({ 
  currentState, 
  onToggleState, 
  onUploadPhoto, 
  photos,
  isGalleryOpen,
  onToggleGallery,
  titleText,
  onTitleChange
}) => {
  const isTree = currentState === TreeMorphState.TREE_SHAPE;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Background Music Player - Always visible */}
      <MusicPlayer />

      <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10 transition-opacity duration-500 ${isGalleryOpen ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Header - Artistic Typography Frame */}
        <header className="flex flex-col items-center mt-6 select-none opacity-0 animate-[fadeIn_2s_ease-out_forwards] pointer-events-auto z-20 w-full">
          <div className="relative group w-full max-w-xl mx-auto py-2 transition-all duration-500">
              
              {/* Minimalist Frame Borders */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
              
              {/* Corner Accents - Gallery Style */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-yellow-500/60" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-yellow-500/60" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-yellow-500/60" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-yellow-500/60" />

              {/* Content Container */}
              <div className="relative flex flex-col items-center justify-center py-5 bg-black/20 backdrop-blur-[2px]">
                  
                  {/* Small Architectural Label */}
                  <span className="text-[10px] md:text-xs tracking-[0.6em] text-yellow-500/50 uppercase font-['Cinzel'] mb-1">
                    The Collection
                  </span>

                  {/* Main Editable Typography */}
                  <input
                      type="text"
                      value={titleText}
                      onChange={(e) => onTitleChange(e.target.value)}
                      placeholder="Enter Title"
                      style={{ fontFamily: "'Great Vibes', cursive" }}
                      className="
                        w-full text-center bg-transparent border-none outline-none 
                        text-5xl md:text-7xl text-[#FFD700] 
                        placeholder-yellow-700/20 
                        drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]
                        transition-all duration-300
                        hover:scale-[1.02] focus:scale-[1.02]
                      "
                      spellCheck={false}
                  />

                  {/* Date/Subtitle */}
                  <span className="mt-2 text-[10px] md:text-xs tracking-[0.3em] text-white/30 uppercase font-['Playfair_Display']">
                    Winter Exhibition • MMXXIV
                  </span>
              </div>
          </div>
        </header>

        {/* Controls */}
        <div className="flex flex-col items-center mb-12 pointer-events-auto gap-4">
          
          {/* Main Action Group */}
          <div className="flex items-center gap-4">
            
            {/* Toggle Button */}
            <button
              onClick={onToggleState}
              className={`
                group relative px-8 py-4 
                border border-yellow-500/30 bg-black/40 backdrop-blur-md
                transition-all duration-700 ease-out
                hover:bg-yellow-900/20 hover:border-yellow-400/80
                rounded-sm overflow-hidden min-w-[160px]
              `}
            >
              {/* Animated Glow Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <div className="flex items-center justify-center gap-3 text-yellow-100">
                {isTree ? (
                    <>
                        <RotateCcw className="w-5 h-5 text-yellow-400 animate-pulse" />
                        <span className="font-['Cinzel'] tracking-widest">DISPERSE</span>
                    </>
                ) : (
                    <>
                        <Trees className="w-5 h-5 text-emerald-400 animate-pulse" />
                        <span className="font-['Cinzel'] tracking-widest">ASSEMBLE</span>
                    </>
                )}
              </div>
            </button>
          </div>

          {/* Secondary Action Group */}
          <div className="flex items-center gap-4">
             {/* Upload Button */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onUploadPhoto} 
                accept="image/*" 
                className="hidden" 
                multiple
            />
            <button
              onClick={triggerUpload}
              className={`
                group relative px-6 py-3
                border border-emerald-500/20 bg-emerald-950/30 backdrop-blur-md
                transition-all duration-500 ease-out
                hover:bg-emerald-900/40 hover:border-emerald-400/50
                rounded-sm overflow-hidden
              `}
            >
                <div className="flex items-center justify-center gap-3 text-emerald-100/80 group-hover:text-emerald-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="font-['Playfair_Display'] tracking-widest text-sm uppercase">Upload</span>
                </div>
            </button>

            {/* Gallery Button */}
            <button
              onClick={onToggleGallery}
              className={`
                group relative px-6 py-3
                border border-emerald-500/20 bg-emerald-950/30 backdrop-blur-md
                transition-all duration-500 ease-out
                hover:bg-emerald-900/40 hover:border-emerald-400/50
                rounded-sm overflow-hidden
              `}
            >
                <div className="flex items-center justify-center gap-3 text-emerald-100/80 group-hover:text-emerald-50 transition-colors">
                    <Images className="w-4 h-4" />
                    <span className="font-['Playfair_Display'] tracking-widest text-sm uppercase">Gallery ({photos.length})</span>
                </div>
            </button>
          </div>
          
          <div className="mt-4 flex gap-8 text-yellow-100/30 text-xs font-['Playfair_Display'] tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              <span>Interactive 3D</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Render</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Slideshow Overlay */}
      {isGalleryOpen && (
        <GallerySlideshow 
            photos={photos} 
            onClose={onToggleGallery} 
            triggerUpload={triggerUpload} 
        />
      )}
    </>
  );
};
