import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Zap, Play } from 'lucide-react';
import { productBrand } from '../content/product';

export default function LandingLayout() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    const handleNewSnap = () => {
        navigate('/login');
    };

    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        html.classList.add('landing-scrollbar');
        body.classList.add('landing-scrollbar');

        return () => {
            html.classList.remove('landing-scrollbar');
            body.classList.remove('landing-scrollbar');
        };
    }, []);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#09090b] text-neutral-900 dark:text-white selection:bg-blue-500/30 relative overflow-x-hidden">
            {/* Background Ambience & Grid */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/15 blur-[150px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed top-1/2 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-neutral-200 dark:border-white/8">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Zap className="w-5 h-5 text-white" fill="currentColor" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">{productBrand.name}</span>
                    </a>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">How it works</a>
                        <a href="#pricing" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Pricing</a>
                        <a href="#faq" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">FAQ</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleNewSnap}
                            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
                        >
                            <Play className="w-4 h-4" fill="currentColor" />
                            {productBrand.navPrimaryCta}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="relative border-t border-neutral-200 dark:border-white/8 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                    <Zap className="w-5 h-5 text-white" fill="currentColor" />
                                </div>
                                <span className="font-bold text-xl tracking-tight">{productBrand.name}</span>
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400 max-w-sm leading-relaxed mb-4">
                                {productBrand.shortDescription}
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-semibold mb-4 text-neutral-900 dark:text-white">Product</h4>
                            <ul className="space-y-2">
                                <li><a href="#features" className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How it works</a></li>
                                <li><a href="#pricing" className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a></li>
                                <li><a href="#faq" className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</a></li>
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h4 className="font-semibold mb-4 text-neutral-900 dark:text-white">Resources</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Documentation</a></li>
                                <li><a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Keyboard Shortcuts</a></li>
                                <li><a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Changelog</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-neutral-200 dark:border-white/8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-neutral-500 dark:text-neutral-600">
                            © {currentYear} {productBrand.name}. {productBrand.footerTagline}
                        </p>
                        <div className="flex items-center gap-6">
                            <a href="#" className="text-sm text-neutral-500 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="text-sm text-neutral-500 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
