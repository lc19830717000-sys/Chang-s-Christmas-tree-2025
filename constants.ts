
// Palette
export const COLORS = {
  APPLE_GREEN: "#6A9E24",   // Granny Smith
  APPLE_RED: "#B80F0A",     // Red Delicious
  PEEL_SKIN: "#D95E5E",     // Reddish skin tone
  PEEL_FLESH: "#FBE7B6",    // Yellowish flesh
  GOLD_STAR: "#FFD700",
  VOID_BG: "#050202",       // Slightly warmer dark void
};

// Tree Dimensions (High and Narrow Cone)
export const TREE_HEIGHT = 18;       // Increased from 13 (Taller)
export const TREE_RADIUS_BASE = 3.6; // Reduced from 5.5 (Much narrower)

// Particle Counts (Sparse, minimalist look)
export const GREEN_APPLE_COUNT = 260;  // Reduced from 480
export const RED_APPLE_COUNT = 55;     // Reduced from 90
export const PEEL_SEGMENTS = 600;      // Reduced from 900

// Animation
export const ANIMATION_SPEED = 2.0;

// Music Playlist (Public Domain / Creative Commons Christmas Music)
export const CHRISTMAS_PLAYLIST = [
  { 
    title: "We Wish You a Merry Christmas", 
    url: "https://upload.wikimedia.org/wikipedia/commons/4/49/Kevin_MacLeod_-_We_Wish_You_a_Merry_Christmas.ogg" 
  },
  { 
    title: "Jingle Bells", 
    url: "https://upload.wikimedia.org/wikipedia/commons/6/61/Kevin_MacLeod_-_Jingle_Bells.ogg" 
  },
  { 
    title: "Deck the Halls", 
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Kevin_MacLeod_-_Deck_the_Halls_B.ogg" 
  },
  { 
    title: "Silent Night", 
    url: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Kevin_MacLeod_-_Silent_Night.ogg" 
  },
  { 
    title: "Oh Holy Night", 
    url: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Kevin_MacLeod_-_Oh_Holy_Night.ogg" 
  }
];

// ==========================================
// [USER CONFIG AREA] PASTE YOUR BASE64 IMAGES BELOW
// ==========================================
// Instructions:
// 1. Convert your image to Base64 (e.g., using https://www.base64-image.de/)
// 2. Paste the long string inside the quotes below in the array.
// 3. Example: ["data:image/jpeg;base64,/9j/4AAQSk...", "data:image/png;base64,iVBOR..."]
export const USER_BASE64_PHOTOS: string[] = [
  // Paste your Base64 strings here:
  
];

// Fallback/Default URLs
// CLEARED: No default stock photos will be shown.
export const DEFAULT_PHOTO_URLS: string[] = [];

// Combine user photos with default photos (now empty)
// Only photos explicitly added by the user (code or UI) will appear.
export const INITIAL_PHOTOS = [...USER_BASE64_PHOTOS, ...DEFAULT_PHOTO_URLS];
