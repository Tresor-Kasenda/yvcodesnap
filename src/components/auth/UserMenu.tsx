import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { User, LogOut, Crown } from 'lucide-react';
import UpgradeModal from '../UpgradeModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function UserMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, subscription, signOut } = useAuthStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
      toast.success('Signed out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <>
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-sm truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 p-0 z-50">
          <div className="px-3 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {subscription.tier === 'free' ? (
                <>
                  Free Plan: {subscription.current_snap_count}/{subscription.snap_limit} snaps
                </>
              ) : (
                <>Pro Plan: Unlimited snaps</>
              )}
            </p>
          </div>

          {subscription.tier === 'free' && (
            <button
              onClick={() => { setShowUpgradeModal(true); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-none hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left mt-0 transition-colors"
            >
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Upgrade to Pro</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-none hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left border-t border-neutral-200 dark:border-neutral-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      )}
    </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentSnaps={subscription.current_snap_count}
        maxSnaps={subscription.snap_limit}
      />
    </>
  );
}
