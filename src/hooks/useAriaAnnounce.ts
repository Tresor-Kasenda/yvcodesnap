import { useEffect, useRef } from 'react';

/**
 * Hook to announce messages to screen readers via aria-live region
 * Useful for notifying users of errors, success messages, and other important updates
 *
 * @param message - The message to announce (null to clear)
 * @param priority - 'polite' waits for pause in speech, 'assertive' interrupts immediately
 */
export function useAriaAnnounce(message: string | null, priority: 'polite' | 'assertive' = 'polite') {
    const regionRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Create aria-live region if it doesn't exist
        if (!regionRef.current) {
            const region = document.createElement('div');
            region.setAttribute('role', 'status');
            region.setAttribute('aria-live', priority);
            region.setAttribute('aria-atomic', 'true');
            region.className = 'sr-only'; // Visually hidden but accessible to screen readers
            document.body.appendChild(region);
            regionRef.current = region;
        }

        // Update the aria-live priority if it changed
        if (regionRef.current && regionRef.current.getAttribute('aria-live') !== priority) {
            regionRef.current.setAttribute('aria-live', priority);
        }

        // Announce message
        if (message && regionRef.current) {
            regionRef.current.textContent = message;
        }

        // Cleanup on unmount
        return () => {
            if (regionRef.current && regionRef.current.parentNode) {
                regionRef.current.parentNode.removeChild(regionRef.current);
                regionRef.current = null;
            }
        };
    }, [message, priority]);
}
