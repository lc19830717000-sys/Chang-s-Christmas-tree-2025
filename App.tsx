
import React, { useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { TreeMorphState } from './types';
import { INITIAL_PHOTOS } from './constants';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.SCATTERED);
  const [photos, setPhotos] = useState<string[]>(INITIAL_PHOTOS);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [titleText, setTitleText] = useState("Merry Christmas");

  const toggleState = useCallback(() => {
    setTreeState((prev) => 
      prev === TreeMorphState.SCATTERED 
        ? TreeMorphState.TREE_SHAPE 
        : TreeMorphState.SCATTERED
    );
  }, []);

  const toggleGallery = useCallback(() => {
    setIsGalleryOpen(prev => !prev);
  }, []);

  const handlePhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            // Add new photo to the beginning of the list
            setPhotos(prev => [e.target!.result as string, ...prev]);
            // Optional: Auto-open gallery or just show success? Let's keep it subtle.
          }
        };
        reader.readAsDataURL(file);
      });
      // Reset input value to allow uploading same file again if needed
      event.target.value = '';
    }
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-black selection:bg-yellow-500/30">
      
      {/* 3D Scene Layer */}
      <Scene treeState={treeState} photos={photos} />
      
      {/* UI Overlay Layer */}
      <UI 
        currentState={treeState} 
        onToggleState={toggleState} 
        onUploadPhoto={handlePhotoUpload}
        photos={photos}
        isGalleryOpen={isGalleryOpen}
        onToggleGallery={toggleGallery}
        titleText={titleText}
        onTitleChange={setTitleText}
      />
      
      {/* Texture Overlay for Film Grain feel (CSS only) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />
      
    </main>
  );
};

export default App;
