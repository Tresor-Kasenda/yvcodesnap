import { GOOGLE_FONTS } from '../types';

// Track loaded fonts to avoid duplicate loading
const loadedFonts = new Set<string>();

export const loadFont = (fontName: string) => {
    if (loadedFonts.has(fontName)) return;

    const fontConfig = GOOGLE_FONTS.find(f => f.name === fontName);
    if (!fontConfig) return;

    // Check if link already exists
    const existingLink = document.querySelector(`link[href="${fontConfig.url}"]`);
    if (existingLink) {
        loadedFonts.add(fontName);
        return;
    }

    const link = document.createElement('link');
    link.href = fontConfig.url;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    loadedFonts.add(fontName);
};

export const loadAllFonts = () => {
    GOOGLE_FONTS.forEach(font => loadFont(font.name));
};
