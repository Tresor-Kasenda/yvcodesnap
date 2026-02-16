import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type SeoConfig = {
    title: string;
    description: string;
    robots: string;
    keywords: string;
    image: string;
    imageAlt: string;
};

const APP_NAME = 'YvCode';

const DEFAULT_CONFIG: SeoConfig = {
    title: `${APP_NAME} | Create Professional Visual Snaps`,
    description:
        'Create professional visuals from code, text, and ideas in minutes. Design, export, and share faster with YvCode.',
    robots: 'index, follow',
    keywords:
        'code screenshot, code image generator, social media visuals, design tool, code snippets, developer tools',
    image: '/og-image-1200x630.svg',
    imageAlt: 'YvCode editor preview with marketing headline',
};

const SEO_BY_ROUTE: Array<{ match: (pathname: string) => boolean; config: SeoConfig }> = [
    {
        match: (pathname) => pathname === '/',
        config: {
            title: `${APP_NAME} | Turn Code And Ideas Into Stunning Visuals`,
            description:
                'Build beautiful visuals for social media and documentation. YvCode helps you create polished snaps and boost engagement quickly.',
            robots: 'index, follow',
            keywords:
                'code snapshots, visual content creator, social media content, screenshots, editor, design',
            image: '/og-image-1200x630.svg',
            imageAlt: 'YvCode hero visual for social sharing',
        },
    },
    {
        match: (pathname) => pathname === '/login' || pathname === '/auth' || pathname.startsWith('/auth/'),
        config: {
            title: `Sign In | ${APP_NAME}`,
            description: 'Access your YvCode account to continue editing and syncing your projects.',
            robots: 'noindex, nofollow',
            keywords: 'login, authentication, account access',
            image: '/og-image-1200x630.svg',
            imageAlt: 'YvCode sign-in page preview',
        },
    },
    {
        match: (pathname) => pathname === '/onboarding',
        config: {
            title: `Onboarding | ${APP_NAME}`,
            description: 'Complete your onboarding to personalize your YvCode experience.',
            robots: 'noindex, nofollow',
            keywords: 'onboarding, setup, profile',
            image: '/og-image-1200x630.svg',
            imageAlt: 'YvCode onboarding page preview',
        },
    },
    {
        match: (pathname) => pathname === '/editor',
        config: {
            title: `Editor | ${APP_NAME}`,
            description: 'Create and edit professional snaps in the YvCode editor.',
            robots: 'noindex, nofollow',
            keywords: 'editor, canvas, visual content',
            image: '/og-image-1200x630.svg',
            imageAlt: 'YvCode editor canvas preview',
        },
    },
];

const getSeoForPath = (pathname: string): SeoConfig =>
    SEO_BY_ROUTE.find((entry) => entry.match(pathname))?.config ?? DEFAULT_CONFIG;

const upsertMetaTag = (selector: string, attrs: Record<string, string>, content: string) => {
    let meta = document.head.querySelector(selector) as HTMLMetaElement | null;
    if (!meta) {
        meta = document.createElement('meta');
        Object.entries(attrs).forEach(([key, value]) => meta?.setAttribute(key, value));
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
};

const upsertCanonical = (url: string) => {
    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
};

export default function SeoManager() {
    const { pathname } = useLocation();

    useEffect(() => {
        const config = getSeoForPath(pathname);
        const canonicalUrl = `${window.location.origin}${pathname}`;
        const ogImageUrl = config.image.startsWith('http')
            ? config.image
            : `${window.location.origin}${config.image}`;

        document.title = config.title;
        upsertCanonical(canonicalUrl);

        upsertMetaTag('meta[name="description"]', { name: 'description' }, config.description);
        upsertMetaTag('meta[name="keywords"]', { name: 'keywords' }, config.keywords);
        upsertMetaTag('meta[name="robots"]', { name: 'robots' }, config.robots);
        upsertMetaTag('meta[property="og:type"]', { property: 'og:type' }, 'website');
        upsertMetaTag('meta[property="og:site_name"]', { property: 'og:site_name' }, APP_NAME);
        upsertMetaTag('meta[property="og:title"]', { property: 'og:title' }, config.title);
        upsertMetaTag('meta[property="og:description"]', { property: 'og:description' }, config.description);
        upsertMetaTag('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
        upsertMetaTag('meta[property="og:image"]', { property: 'og:image' }, ogImageUrl);
        upsertMetaTag('meta[property="og:image:width"]', { property: 'og:image:width' }, '1200');
        upsertMetaTag('meta[property="og:image:height"]', { property: 'og:image:height' }, '630');
        upsertMetaTag('meta[property="og:image:alt"]', { property: 'og:image:alt' }, config.imageAlt);
        upsertMetaTag('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
        upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' }, config.title);
        upsertMetaTag('meta[name="twitter:description"]', { name: 'twitter:description' }, config.description);
        upsertMetaTag('meta[name="twitter:image"]', { name: 'twitter:image' }, ogImageUrl);
        upsertMetaTag('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, config.imageAlt);
    }, [pathname]);

    return null;
}
