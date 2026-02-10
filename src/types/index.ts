export type BackgroundType = 'solid' | 'gradient';

export interface SolidBackground {
  color: string;
}

export interface GradientBackground {
  from: string;
  to: string;
  angle: number;
}

export interface SocialMedia {
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  github?: string;
  youtube?: string;
  tiktok?: string;
}

export interface Branding {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  name: string;
  website: string;
  social: SocialMedia;
  avatarUrl?: string;
  showName: boolean;
  showWebsite: boolean;
  showSocial: boolean;
  showAvatar: boolean;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  padding: number;
  socialIconSize?: number;
  socialLayout?: 'horizontal' | 'vertical';
  avatarSize?: number;
}

export interface BrandStrip {
  enabled: boolean;
  position: 'top' | 'bottom';
  height: number;
  color: string;
  text: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
}

export interface Background {
  type: BackgroundType;
  solid: SolidBackground;
  gradient: GradientBackground;
  brandStrip: BrandStrip;
  branding: Branding;
}

export interface Shadow {
  blur: number;
  spread: number;
  color: string;
}

export interface LineHighlight {
  from: number;
  to: number;
  style: 'focus' | 'added' | 'removed';
}

export interface CodeBlockProps {
  code: string;
  language: string;
  theme: CodeThemeId;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  lineNumbers: boolean;
  highlights: LineHighlight[];
  focusMode?: boolean;
  padding: number;
  cornerRadius: number;
  shadow: Shadow;
}

export interface TextProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
  background: { color: string } | null;
  padding: number;
  cornerRadius: number;
}

export interface ArrowProps {
  style: 'straight' | 'curved';
  color: string;
  thickness: number;
  radius?: number;
  padding?: number;
  head: 'filled' | 'outline' | 'none';
  controlPoints?: { x: number; y: number }[]; // For curved arrows - bezier control points
  label?: string; // Optional text label
  labelPosition?: number; // 0-1, position along the arrow
}

export type ShapeKind = 'rectangle' | 'ellipse' | 'line' | 'polygon' | 'star';

export type ElementType = 'code' | 'text' | 'arrow' | 'shape' | 'image' | 'group';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  name?: string;
}

export interface CodeElement extends BaseElement {
  type: 'code';
  width: number;
  height: number;
  props: CodeBlockProps;
}

export interface TextElement extends BaseElement {
  type: 'text';
  width: number;
  height: number;
  props: TextProps;
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  points: { x: number; y: number }[];
  props: ArrowProps;
}

export interface ShapeProps {
  kind: ShapeKind;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
  padding?: number;
  fill?: string;
  sides?: number; // for polygon/star
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  width: number;
  height: number;
  props: ShapeProps;
  points?: { x: number; y: number }[]; // for line
}

export interface ImageProps {
  src: string;
  width: number;
  height: number;
  opacity: number;
  cornerRadius: number;
  shadow: Shadow;
  rotate: number;
  fit: 'cover' | 'contain' | 'fill';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  width: number;
  height: number;
  props: ImageProps;
}

export interface GroupElement extends BaseElement {
  type: 'group';
  elements: CanvasElement[];
  width: number;
  height: number;
}

export type CanvasElement =
  | CodeElement
  | TextElement
  | ArrowElement
  | ShapeElement
  | ImageElement
  | GroupElement;

export interface AspectRatio {
  name: string;
  width: number;
  height: number;
}

export interface CanvasMeta {
  title: string;
  aspect: string;
  width: number;
  height: number;
}

export interface Snap {
  version: string;
  meta: CanvasMeta;
  background: Background;
  elements: CanvasElement[];
}

export const ASPECT_RATIOS: AspectRatio[] = [
  { name: 'Square (1:1)', width: 1080, height: 1080 },
  { name: 'Landscape (16:9)', width: 1920, height: 1080 },
  { name: 'Portrait (4:5)', width: 1080, height: 1350 },
  { name: 'Story (9:16)', width: 1080, height: 1920 },
  { name: 'Twitter Post (16:9)', width: 1600, height: 900 },
  { name: 'LinkedIn (4:5)', width: 1200, height: 1500 },
  { name: 'Dribbble (4:3)', width: 1600, height: 1200 },
  { name: 'Pinterest (2:3)', width: 1000, height: 1500 },
  { name: 'Laptop (16:10)', width: 1920, height: 1200 },
];

export const CODE_THEMES = [
  // IntelliJ / Android Studio themes (prioritized for Kotlin)
  { id: 'andromeeda', name: 'Andromeeda', bg: '#23262e' },
  { id: 'aurora-x', name: 'Aurora X', bg: '#07090f' },
  { id: 'dark-plus', name: 'Dark+ (VS Code)', bg: '#1e1e1e' },
  { id: 'dracula', name: 'Dracula', bg: '#282a36' },
  { id: 'dracula-soft', name: 'Dracula Soft', bg: '#282a36' },
  { id: 'github-dark', name: 'GitHub Dark', bg: '#0d1117' },
  { id: 'github-dark-dimmed', name: 'GitHub Dimmed', bg: '#22272e' },
  { id: 'github-light', name: 'GitHub Light', bg: '#ffffff' },
  { id: 'light-plus', name: 'Light+ (VS Code)', bg: '#ffffff' },
  { id: 'material-theme-darker', name: 'Material Darker', bg: '#212121' },
  { id: 'material-theme-ocean', name: 'Material Ocean', bg: '#0f111a' },
  { id: 'material-theme-palenight', name: 'Material Palenight', bg: '#292d3e' },
  { id: 'min-dark', name: 'Min Dark', bg: '#1f1f1f' },
  { id: 'min-light', name: 'Min Light', bg: '#ffffff' },
  { id: 'monokai', name: 'Monokai', bg: '#272822' },
  { id: 'night-owl', name: 'Night Owl', bg: '#011627' },
  { id: 'nord', name: 'Nord', bg: '#2e3440' },
  { id: 'one-dark-pro', name: 'One Dark Pro', bg: '#282c34' },
  { id: 'poimandres', name: 'Poimandres', bg: '#1b1e28' },
  { id: 'rose-pine', name: 'Rosé Pine', bg: '#191724' },
  { id: 'rose-pine-moon', name: 'Rosé Pine Moon', bg: '#232136' },
  { id: 'slack-dark', name: 'Slack Dark', bg: '#222222' },
  { id: 'solarized-dark', name: 'Solarized Dark', bg: '#002b36' },
  { id: 'solarized-light', name: 'Solarized Light', bg: '#fdf6e3' },
  { id: 'tokyo-night', name: 'Tokyo Night', bg: '#1a1b26' },
  { id: 'vesper', name: 'Vesper', bg: '#101010' },
  { id: 'vitesse-dark', name: 'Vitesse Dark', bg: '#121212' },
  { id: 'vitesse-light', name: 'Vitesse Light', bg: '#ffffff' },
] as const;

export type CodeThemeId = typeof CODE_THEMES[number]['id'];

export const LANGUAGES = [
  'kotlin',
  'java',
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'swift',
  'dart',
  'html',
  'css',
  'json',
  'xml',
  'yaml',
  'markdown',
  'bash',
  'sql',
  'groovy',
  'php',
] as const;

export const FONT_FAMILIES = {
  code: ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono', 'Cascadia Code', 'monospace'],
  text: ['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat', 'Lato', 'Nunito', 'Raleway', 'sans-serif'],
  brand: ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'sans-serif'],
};

// Google Fonts URLs for custom fonts
export const GOOGLE_FONTS = [
  { name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  { name: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' },
  { name: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap' },
  { name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap' },
  { name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap' },
  { name: 'Nunito', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap' },
  { name: 'Raleway', url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap' },
  { name: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap' },
  { name: 'JetBrains Mono', url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap' },
  { name: 'Fira Code', url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap' },
  { name: 'Source Code Pro', url: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;700&display=swap' },
  { name: 'IBM Plex Mono', url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap' },
  { name: 'Cascadia Code', url: 'https://fonts.googleapis.com/css2?family=Cascadia+Code&display=swap' },
];

// Auth and Cloud Types
export type OnboardingUseCase = 'social-content' | 'marketing-campaigns' | 'education-training' | 'internal-communication';
export type OnboardingExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type OnboardingPrimaryFormat = 'social-posts' | 'presentations' | 'tutorials' | 'documents' | 'ads' | 'mixed';
export type OnboardingPlanIntent = 'free' | 'pro-trial' | 'team';

export interface OnboardingPreferences {
  fullName: string;
  useCase: OnboardingUseCase;
  experienceLevel: OnboardingExperienceLevel;
  primaryFormat: OnboardingPrimaryFormat;
  planIntent: OnboardingPlanIntent;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  subscription_tier: 'free' | 'pro';
  free_exports_used?: number | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_use_case: OnboardingUseCase | null;
  onboarding_experience_level: OnboardingExperienceLevel | null;
  onboarding_primary_format: OnboardingPrimaryFormat | null;
  onboarding_plan_intent: OnboardingPlanIntent | null;
  created_at: string;
  updated_at: string;
}

export interface UserMetadata {
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  onboarding_preferences?: OnboardingPreferences;
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_tier?: 'free' | 'pro';
  user_metadata?: UserMetadata;
}

export interface CloudSnap {
  id: string;
  user_id: string;
  title: string;
  data: Snap;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncAt?: number;
  pendingChanges: number;
  error?: string;
}

export interface Subscription {
  tier: 'free' | 'pro';
  snap_limit: number; // -1 for unlimited
  current_snap_count: number;
}
