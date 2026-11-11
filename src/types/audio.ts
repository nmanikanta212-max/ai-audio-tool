export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Neutral';
  tone: string;
  description: string;
  tags: string[];
}

export type AudioGenrePreset =
  | 'podcast'
  | 'audiobook'
  | 'meditation'
  | 'news'
  | 'cinematic'
  | 'educational'
  | 'comedy';

export type SpeechPace = '0.8x' | '1.0x' | '1.15x' | '1.3x';
export type PitchResonance = 'deep' | 'balanced' | 'high';
export type EmotionTone = 'neutral' | 'enthusiastic' | 'mysterious' | 'calm' | 'whisper' | 'dramatic';
export type AmbientSoundscape = 'none' | 'rain' | 'space' | 'waves' | 'cafe' | 'forest';

export interface GenerationOptions {
  genrePreset: AudioGenrePreset;
  pace: SpeechPace;
  pitch: PitchResonance;
  emotion: EmotionTone;
  ambientSoundscape: AmbientSoundscape;
  ambientVolume: number; // 0 to 1
  normalizeAudio: boolean;
  addChapterBeeps: boolean;
  breathFrequency: 'natural' | 'minimal' | 'frequent';
}

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  genrePreset: 'podcast',
  pace: '1.0x',
  pitch: 'balanced',
  emotion: 'enthusiastic',
  ambientSoundscape: 'none',
  ambientVolume: 0.15,
  normalizeAudio: true,
  addChapterBeeps: false,
  breathFrequency: 'natural',
};

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    tone: 'Expressive, warm & articulate',
    description: 'Perfect for narrative fiction, podcasts, documentaries, and audiobooks.',
    tags: ['Narrative', 'Podcast', 'Warm', 'Versatile'],
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    tone: 'Charismatic, lively & energetic',
    description: 'Energetic and dynamic voice ideal for conversational shows, tech reviews, and youth content.',
    tags: ['Energetic', 'Conversational', 'Youthful', 'Dynamic'],
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    tone: 'Deep, cinematic & authoritative',
    description: 'Deep resonant tone perfect for thrillers, movie trailers, crime stories, and breaking news.',
    tags: ['Cinematic', 'Deep', 'Authoritative', 'Dramatic'],
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    tone: 'Rich, storytelling & grounded',
    description: 'Grounded storyteller voice suited for fantasy series, history epics, and philosophy talks.',
    tags: ['Storyteller', 'Rich', 'Wise', 'Epic'],
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    tone: 'Gentle, soothing & tranquil',
    description: 'Soft whisper-friendly voice ideal for sleep stories, guided meditation, and ASMR audiobooks.',
    tags: ['Meditation', 'Gentle', 'ASMR', 'Soothing'],
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Female',
    tone: 'Bright, crisp & academic',
    description: 'Crystal-clear diction ideal for language learning, business summaries, and scientific lectures.',
    tags: ['Clear', 'Academic', 'News', 'Educational'],
  },
];

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  sampleGreeting: string;
}

export const POPULAR_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English', flag: '🇺🇸', region: 'Americas', sampleGreeting: 'Welcome to VoxInfinite audio studio.' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)', flag: '🇬🇧', region: 'Europe', sampleGreeting: 'Welcome to this captivating audio journey.' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'Europe', sampleGreeting: 'Bienvenidos a esta fascinante serie de audio.' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'Europe', sampleGreeting: 'Bienvenue dans cette aventure sonore captivante.' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'Europe', sampleGreeting: 'Willkommen zu diesem fantastischen Hörspiel.' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', region: 'Asia', sampleGreeting: 'ようこそ、次世代のオーディオシリーズへ。' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'Asia', sampleGreeting: 'वॉक्सइनफिनाइट ऑडियो सीरीज में आपका स्वागत है।' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', region: 'Asia', sampleGreeting: 'ఈ సరికొత్త ఆడియో సిరీస్‌కి స్వాగతం!' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)', nativeName: '中文 (普通话)', flag: '🇨🇳', region: 'Asia', sampleGreeting: '欢迎收听由人工智能驱动的精彩音频剧集。' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português', flag: '🇧🇷', region: 'Americas', sampleGreeting: 'Bem-vindo a esta incrível série de áudio.' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'Europe', sampleGreeting: 'Benvenuti in questo affascinante viaggio sonoro.' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', region: 'Asia', sampleGreeting: '환영합니다! 인공지능 기반 오디오 시리즈입니다.' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', region: 'Middle East', sampleGreeting: 'مرحباً بكم في هذه السلسلة الصوتية المشوقة.' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', region: 'Europe', sampleGreeting: 'Добро пожаловать в захватывающий аудиосериал.' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', region: 'Europe', sampleGreeting: 'Büyüleyici ses serimize hoş geldiniz.' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', region: 'Europe', sampleGreeting: 'Welkom bij deze boeiende audioserie.' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', region: 'Europe', sampleGreeting: 'Välkommen till en helt ny ljudupplevelse.' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', region: 'Europe', sampleGreeting: 'Witamy w niesamowitej serii audio.' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', region: 'Asia', sampleGreeting: 'Selamat datang di serial audio kami.' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', region: 'Asia', sampleGreeting: 'Chào mừng bạn đến với chuỗi tập âm thanh đặc biệt.' },
  { code: 'th-TH', name: 'Thai', nativeName: 'ภาษาไทย', flag: '🇹🇭', region: 'Asia', sampleGreeting: 'ยินดีต้อนรับสู่ซีรีส์เสียงที่คุณจะหลงรัก' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', region: 'Asia', sampleGreeting: 'இந்த அற்புதம் வாய்ந்த ஆடியோ தொடருக்கு வருக!' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', region: 'Asia', sampleGreeting: 'এই চমৎকার অডিও সিরিজে আপনাদের স্বাগতম।' },
];

export interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  styleCue?: string;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  synopsis: string;
  scriptFormat: 'dialogue' | 'solo';
  targetDurationMinutes?: number; // min 10, max 30
  soloScript?: string;
  dialogueLines?: DialogueLine[];
  audioBase64?: string;
  audioUrl?: string;
  mimeType?: string;
  duration?: number;
  isGenerating?: boolean;
  error?: string;
  generatedAt?: string;
}

export interface SpeakerConfig {
  name: string;
  role: string;
  voice: string; // Kore, Puck, Charon, Fenrir, Zephyr, Aoede
  gender?: 'Male' | 'Female';
  style: string;
}

export interface AudioSeries {
  id: string;
  title: string;
  description: string;
  genre: string;
  language: string;
  format: 'dialogue' | 'solo';
  targetDurationMinutes?: number; // min 10, max 30
  speaker1: SpeakerConfig;
  speaker2?: SpeakerConfig;
  episodes: Episode[];
  coverGradient: string;
  createdAt: string;
  tags: string[];
}

export interface SavedClip {
  id: string;
  title: string;
  text: string;
  voice: string;
  language: string;
  audioBase64: string;
  audioUrl: string;
  duration?: number;
  createdAt: string;
  seriesId?: string;
  episodeId?: string;
  type: 'quick' | 'series_episode';
}
