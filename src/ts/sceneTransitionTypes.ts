import type { TextCrawlConfig } from './textCrawl';
import type { PresentationThemeConfig } from './theme';

export type SceneTransitionType = 'industrial-doors' | 'horizontal-shutter' | 'fade';

export type SceneTransitionAnimationConfig = {
  type?: SceneTransitionType;
  theme?: PresentationThemeConfig;
};

export type SceneTransitionSoundProfileType =
  | 'bulkhead'
  | 'classic-industrial'
  | 'heavy-industrial'
  | 'harsh-industrial'
  | 'terminal'
  | 'scanline'
  | 'alert'
  | 'hologram'
  | 'classified'
  | 'silent';

export type SceneTransitionSoundProfileConfig = {
  type?: SceneTransitionSoundProfileType;
};

export type SceneTransitionConfig = {
  sceneName: string;
  id?: string;
  theme?: PresentationThemeConfig;
  transition?: SceneTransitionAnimationConfig;
  soundProfile?: SceneTransitionSoundProfileConfig;
  text?: TextCrawlConfig;
  timing?: SceneTransitionTiming;
  sounds?: SceneTransitionSounds;
  aboveUi?: boolean;
  blockInteractions?: boolean;
};

export type SceneTransitionSocketConfig = Omit<SceneTransitionConfig, 'sceneName'> & {
  sceneId: string;
  sceneName: string;
};

export type SceneTransitionTiming = {
  doorCloseMs?: number;
  briefingMs?: number;
  doorUnlockMs?: number;
  doorOpenMs?: number;
  fadeOutMs?: number;
  fadeInMs?: number;
  textFadeMs?: number;
  sceneReadyTimeoutMs?: number;
};

export type SceneTransitionSounds = {
  doorClose?: string;
  doorSeal?: string;
  doorUnlock?: string;
  doorOpen?: string;
  typingClick?: string;
  doorVolume?: number;
  typingVolume?: number;
};

export type NormalizedSceneTransitionConfig = Required<
  Omit<SceneTransitionSocketConfig, 'text' | 'theme' | 'transition' | 'soundProfile' | 'timing' | 'sounds'>
> & {
  theme: Required<PresentationThemeConfig>;
  transition: {
    type: SceneTransitionType;
    theme: Required<PresentationThemeConfig>;
  };
  soundProfile: Required<SceneTransitionSoundProfileConfig>;
  text?: TextCrawlConfig;
  timing: Required<SceneTransitionTiming>;
  sounds: Required<SceneTransitionSounds>;
};

export type TransitionSound = {
  stop: () => Promise<unknown> | unknown;
};

export type TransitionAudio = {
  stop: () => Promise<unknown> | unknown;
};

export type AudioCancellationController = {
  canceled: boolean;
};

export type TransitionAudioController = {
  play: (src: string, volume: number) => void;
  startTyping: (
    text: TextCrawlConfig,
    sounds: Required<SceneTransitionSounds>,
    controller: AudioCancellationController
  ) => TransitionAudio | undefined;
  stopAll: () => Promise<void>;
};

export type TransitionController = {
  canceled: boolean;
  cancel: () => void;
  cancelPromise: Promise<void>;
};

export type AudioHelperGlobal = {
  play: (
    data: { src: string; volume: number; loop: boolean },
    socketOptions?: boolean | null
  ) => Promise<TransitionSound>;
};

export type GameAudioGlobal = {
  play?: (
    src: string,
    options?: { volume?: number; loop?: boolean }
  ) => Promise<TransitionSound>;
  create?: (data: { src: string }) => TransitionSound & {
    volume?: number;
    load?: () => Promise<unknown>;
    play?: (options?: { loop?: boolean }) => Promise<unknown> | unknown;
  };
};
