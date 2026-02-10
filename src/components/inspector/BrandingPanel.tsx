import React, { useEffect, useCallback } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useBrandingStore } from '../../store/brandingStore';
import { FONT_FAMILIES } from '../../types';
import { SocialIcon } from '../elements/SocialIcons';
import SelectField from '../ui/SelectField';
import ToggleSwitch from '../ui/ToggleSwitch';
import SliderField from '../ui/SliderField';
import AccessibleColorPicker from '../ui/AccessibleColorPicker';
import HoverTooltip from '../ui/HoverTooltip';
import PositionControls from './PositionControls';
import type { HorizontalPosition, VerticalPosition } from './positionUtils';

const SOCIAL_PLATFORMS = [
  { key: 'twitter', label: 'X (Twitter)', placeholder: '@username' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: '/in/username' },
  { key: 'instagram', label: 'Instagram', placeholder: '@username' },
  { key: 'github', label: 'GitHub', placeholder: 'username' },
  { key: 'youtube', label: 'YouTube', placeholder: '@channel' },
  { key: 'tiktok', label: 'TikTok', placeholder: '@username' },
] as const;

const MAX_AVATAR_DIMENSION = 192;
const MAX_EMBEDDED_AVATAR_LENGTH = 350000;

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      resolve(reader.result);
    } else {
      reject(new Error('Could not read file contents.'));
    }
  };
  reader.onerror = () => reject(reader.error ?? new Error('Avatar read failed.'));
  reader.readAsDataURL(file);
});

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Avatar image could not be loaded.'));
  img.src = src;
});

const optimiseAvatarFile = async (file: File): Promise<string> => {
  const rawDataUrl = await readFileAsDataUrl(file);

  if (rawDataUrl.length <= MAX_EMBEDDED_AVATAR_LENGTH) {
    return rawDataUrl;
  }

  try {
    const image = await loadImage(rawDataUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return rawDataUrl;
    }

    let targetSize = MAX_AVATAR_DIMENSION;
    let optimised = rawDataUrl;

    while (targetSize >= 96) {
      const maxSide = Math.max(image.width, image.height);
      const scale = maxSide > targetSize ? targetSize / maxSide : 1;
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      optimised = canvas.toDataURL('image/png');
      if (optimised.length <= MAX_EMBEDDED_AVATAR_LENGTH) {
        break;
      }

      optimised = canvas.toDataURL('image/jpeg', 0.82);
      if (optimised.length <= MAX_EMBEDDED_AVATAR_LENGTH) {
        break;
      }

      targetSize = Math.floor(targetSize * 0.75);
    }

    return optimised.length <= MAX_EMBEDDED_AVATAR_LENGTH ? optimised : rawDataUrl;
  } catch (error) {
    console.warn('Avatar optimisation failed, keeping the original image.', error);
    return rawDataUrl;
  }
};

const BrandingPanel: React.FC = () => {
  const { setBackground } = useCanvasStore();
  const { info, preferences, updateInfo, updateSocial, updatePreferences } = useBrandingStore();
  const horizontalPosition: HorizontalPosition = preferences.position.endsWith('right')
    ? 'right'
    : preferences.position.endsWith('center')
      ? 'center'
      : 'left';
  const verticalPosition: VerticalPosition = preferences.position.startsWith('bottom')
    ? 'bottom'
    : preferences.position.startsWith('middle')
      ? 'middle'
      : 'top';

  // Sync branding store to canvas whenever it changes
  useEffect(() => {
    setBackground({
      branding: {
        ...preferences,
        name: info.name,
        website: info.website,
        social: info.social,
        avatarUrl: info.avatarUrl,
      },
    });
  }, [info, preferences, setBackground]);

  const handleUpdatePreferences = (updates: Partial<typeof preferences>) => {
    updatePreferences(updates);
  };

  const handleUpdateInfo = (updates: Partial<typeof info>) => {
    updateInfo(updates);
  };

  const handleUpdateSocial = (platform: string, value: string) => {
    updateSocial(platform, value);
  };

  const handleAvatarUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    const resetInput = () => {
      if (event.target) {
        event.target.value = '';
      }
    };

    if (!file || !file.type.startsWith('image/')) {
      resetInput();
      return;
    }

    void optimiseAvatarFile(file)
      .then((dataUrl) => {
        handleUpdateInfo({ avatarUrl: dataUrl });
        handleUpdatePreferences({ showAvatar: true });
      })
      .catch((error) => {
        console.warn('Avatar upload cancelled.', error);
      })
      .finally(resetInput);
  }, [handleUpdateInfo, handleUpdatePreferences]);

  const handleAvatarClear = useCallback(() => {
    handleUpdateInfo({ avatarUrl: '' });
  }, [handleUpdateInfo]);

  return (
    <div className="space-y-6">
      {/* Enable Branding */}
      <div className="flex items-center justify-between">
        <label
          className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider"
          htmlFor="branding-watermark-toggle"
        >
          Branding Watermark
        </label>
        <ToggleSwitch
          id="branding-watermark-toggle"
          checked={preferences.enabled}
          onCheckedChange={(checked) => handleUpdatePreferences({ enabled: checked })}
          ariaLabel="Toggle branding watermark"
        />
      </div>

      {preferences.enabled && (
        <div className="space-y-5">
          {/* Position */}
          <div>
            <PositionControls
              label="Position"
              horizontal={horizontalPosition}
              vertical={verticalPosition}
              onHorizontalChange={(nextHorizontal) => {
                handleUpdatePreferences({
                  position: `${verticalPosition}-${nextHorizontal}` as typeof preferences.position,
                });
              }}
              onVerticalChange={(nextVertical) => {
                handleUpdatePreferences({
                  position: `${nextVertical}-${horizontalPosition}` as typeof preferences.position,
                });
              }}
            />
          </div>

          {/* Avatar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider">
                Avatar
              </label>
              <HoverTooltip label={preferences.showAvatar ? 'Hide avatar' : 'Show avatar'}>
                <button
                  onClick={() => handleUpdatePreferences({ showAvatar: !preferences.showAvatar })}
                  className={`text-xs px-2 py-0.5 rounded ${preferences.showAvatar
                    ? 'bg-blue-600/15 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-white/5 dark:text-neutral-500'
                    }`}
                  aria-label={preferences.showAvatar ? 'Hide avatar' : 'Show avatar'}
                >
                  {preferences.showAvatar ? 'Hide' : 'Show'}
                </button>
              </HoverTooltip>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative w-16 h-16 rounded-full border border-white/10 bg-white/5 overflow-hidden cursor-pointer group">
                {info.avatarUrl ? (
                  <img
                    src={info.avatarUrl}
                    alt="Brand avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-300">
                    <span>Upload</span>
                    <span className="text-[9px] text-neutral-600">PNG/JPG</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Upload avatar"
                />
              </label>
              <div className="flex-1 text-[11px] text-neutral-600 dark:text-neutral-500 space-y-1">
                <p>Use a square image for best results. Supported formats: PNG, JPG, SVG.</p>
                {info.avatarUrl && (
                  <HoverTooltip label="Remove avatar">
                    <button
                      onClick={handleAvatarClear}
                      className="text-xs text-neutral-400 hover:text-red-400 transition-colors"
                      aria-label="Remove avatar"
                    >
                      Remove avatar
                    </button>
                  </HoverTooltip>
                )}
              </div>
            </div>
            {preferences.showAvatar && (
              <div className="mt-3">
                <label className="block text-xs text-neutral-500 mb-2">
                  Size: {preferences.avatarSize}px
                </label>
                <SliderField
                  min={32}
                  max={120}
                  step={1}
                  value={preferences.avatarSize}
                  onValueChange={(v) => handleUpdatePreferences({ avatarSize: v })}
                  ariaLabel="Avatar size"
                />
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider">
                Name
              </label>
              <HoverTooltip label={preferences.showName ? 'Hide name' : 'Show name'}>
                <button
                  onClick={() => handleUpdatePreferences({ showName: !preferences.showName })}
                  className={`text-xs px-2 py-0.5 rounded ${preferences.showName
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'bg-white/5 text-neutral-500'
                    }`}
                  aria-label={preferences.showName ? 'Hide name' : 'Show name'}
                >
                  {preferences.showName ? 'Hide' : 'Show'}
                </button>
              </HoverTooltip>
            </div>
            <input
              type="text"
              value={info.name}
              onChange={(e) => handleUpdateInfo({ name: e.target.value })}
              placeholder="Your Name"
                className="w-full bg-neutral-100 text-neutral-900 border border-neutral-200 px-3 py-2 rounded-lg text-sm focus:border-blue-500/50 focus:outline-none dark:bg-white/5 dark:text-white dark:border-white/5"
            />
          </div>

          {/* Website */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider">
                Website
              </label>
              <HoverTooltip label={preferences.showWebsite ? 'Hide website' : 'Show website'}>
                <button
                  onClick={() => handleUpdatePreferences({ showWebsite: !preferences.showWebsite })}
                  className={`text-xs px-2 py-0.5 rounded ${preferences.showWebsite
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'bg-white/5 text-neutral-500'
                    }`}
                  aria-label={preferences.showWebsite ? 'Hide website' : 'Show website'}
                >
                  {preferences.showWebsite ? 'Hide' : 'Show'}
                </button>
              </HoverTooltip>
            </div>
            <input
              type="text"
              value={info.website}
              onChange={(e) => handleUpdateInfo({ website: e.target.value })}
              placeholder="yourwebsite.com"
                className="w-full bg-neutral-100 text-neutral-900 border border-neutral-200 px-3 py-2 rounded-lg text-sm focus:border-blue-500/50 focus:outline-none dark:bg-white/5 dark:text-white dark:border-white/5"
            />
          </div>

          {/* Social Media */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider">
                Social Media
              </label>
              <HoverTooltip label={preferences.showSocial ? 'Hide social media' : 'Show social media'}>
                <button
                  onClick={() => handleUpdatePreferences({ showSocial: !preferences.showSocial })}
                  className={`text-xs px-2 py-0.5 rounded ${preferences.showSocial
                    ? 'bg-blue-600/15 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-white/5 dark:text-neutral-500'
                    }`}
                  aria-label={preferences.showSocial ? 'Hide social media' : 'Show social media'}
                >
                  {preferences.showSocial ? 'Hide' : 'Show'}
                </button>
              </HoverTooltip>
            </div>
            <div className="space-y-2">
              {SOCIAL_PLATFORMS.map((platform) => (
                <div key={platform.key} className="relative">
                  <input
                    type="text"
                    value={info.social[platform.key as keyof typeof info.social] || ''}
                    onChange={(e) => handleUpdateSocial(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className="w-full pl-9 pr-2 bg-neutral-100 text-neutral-900 py-2 rounded-md text-xs border border-neutral-200 focus:border-blue-500/50 focus:outline-none dark:bg-white/5 dark:text-white dark:border-white/5"
                  />
                  <div className="absolute inset-y-0 left-2 flex items-center text-neutral-400 pointer-events-none">
                    <SocialIcon platform={platform.key} size={16} color="currentColor" />
                  </div>
                </div>
              ))}
            </div>

            {/* Social Icons Layout */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-neutral-600 dark:text-neutral-500 mb-2">Layout</label>
                <div className="flex gap-2">
                  <HoverTooltip label="Horizontal layout">
                    <button
                      onClick={() => handleUpdatePreferences({ socialLayout: 'horizontal' })}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${preferences.socialLayout === 'horizontal'
                        ? 'bg-blue-600/15 text-blue-700 border-blue-500/50 dark:bg-blue-600/20 dark:text-blue-400'
                        : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border-neutral-200 dark:bg-white/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 dark:border-white/5'
                        }`}
                      aria-label="Horizontal social layout"
                    >
                      Horizontal
                    </button>
                  </HoverTooltip>
                  <HoverTooltip label="Vertical layout">
                    <button
                      onClick={() => handleUpdatePreferences({ socialLayout: 'vertical' })}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${preferences.socialLayout === 'vertical'
                        ? 'bg-blue-600/15 text-blue-700 border-blue-500/50 dark:bg-blue-600/20 dark:text-blue-400'
                        : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border-neutral-200 dark:bg-white/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 dark:border-white/5'
                        }`}
                      aria-label="Vertical social layout"
                    >
                      Vertical
                    </button>
                  </HoverTooltip>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-600 dark:text-neutral-500 mb-2">
                  Icon Size: {preferences.socialIconSize}px
                </label>
                <SliderField
                  min={14}
                  max={32}
                  step={1}
                  value={preferences.socialIconSize}
                  onValueChange={(v) => handleUpdatePreferences({ socialIconSize: v })}
                  ariaLabel="Social icon size"
                />
              </div>
            </div>
          </div>

          {/* Styling */}
          <div className="pt-4 border-t border-white/5">
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-3">
              Styling
            </label>

            {/* Font Family */}
            <div className="mb-4">
              <label className="block text-xs text-neutral-600 dark:text-neutral-500 mb-2">Font</label>
              <SelectField
                value={preferences.fontFamily}
                onValueChange={(value) => handleUpdatePreferences({ fontFamily: value })}
                options={FONT_FAMILIES.text.map((font) => ({
                  value: font,
                  label: <span style={{ fontFamily: font }}>{font}</span>,
                }))}
              />
            </div>

            {/* Font Size */}
            <div className="mb-4">
              <label className="block text-xs text-neutral-600 dark:text-neutral-500 mb-2">
                Font Size: {preferences.fontSize}px
              </label>
              <SliderField
                min={10}
                max={24}
                step={1}
                value={preferences.fontSize}
                onValueChange={(v) => handleUpdatePreferences({ fontSize: v })}
                ariaLabel="Font size"
              />
            </div>

            {/* Color */}
            <div className="mb-4">
              <label className="block text-xs text-neutral-600 dark:text-neutral-500 mb-2">Color</label>
              <div className="flex gap-2 items-center p-2 bg-neutral-100 border border-neutral-200 rounded-lg dark:bg-white/5 dark:border-white/5">
                <AccessibleColorPicker
                  value={preferences.color}
                  onChange={(color) => handleUpdatePreferences({ color })}
                  ariaLabel="Branding color"
                  className="h-6 w-6"
                />
                <input
                  type="text"
                  value={preferences.color}
                  onChange={(e) => handleUpdatePreferences({ color: e.target.value })}
                  className="w-full bg-transparent text-neutral-900 dark:text-white text-xs focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Opacity */}
            <div className="mb-4">
              <label className="block text-xs text-neutral-600 dark:text-neutral-500 mb-2">
                Opacity: {Math.round(preferences.opacity * 100)}%
              </label>
              <SliderField
                min={0.1}
                max={1}
                step={0.05}
                value={preferences.opacity}
                onValueChange={(v) => handleUpdatePreferences({ opacity: v })}
                ariaLabel="Opacity"
              />
            </div>

            {/* Padding */}
            <div>
              <label className="block text-xs text-neutral-600 dark:text-neutral-500 mb-2">
                Padding: {preferences.padding}px
              </label>
              <SliderField
                min={8}
                max={48}
                step={1}
                value={preferences.padding}
                onValueChange={(v) => handleUpdatePreferences({ padding: v })}
                ariaLabel="Padding"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandingPanel;
