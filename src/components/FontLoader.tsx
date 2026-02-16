import { useEffect } from 'react';
import { loadFont } from '../utils/fontLoader';

interface FontLoaderProps {
    fonts?: string[];
}

const FontLoader: React.FC<FontLoaderProps> = ({ fonts }) => {
    useEffect(() => {
        if (fonts && fonts.length > 0) {
            fonts.forEach(loadFont);
        } else {
            // Load essential fonts by default
            loadFont('Inter');
            loadFont('JetBrains Mono');
            loadFont('Fira Code');
        }
    }, [fonts]);

    return null;
};

export default FontLoader;
