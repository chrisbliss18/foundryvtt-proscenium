import type { ModuleSocket } from './types';
import { createOverlay, type OverlayConfig } from './overlay';
import { playSceneTransition } from './sceneTransition';
import type {
  SceneTransitionConfig,
  SceneTransitionSoundProfileType,
  SceneTransitionSounds,
  SceneTransitionTiming,
  SceneTransitionType
} from './sceneTransitionTypes';
import type {
  TextCrawlAlignment,
  TextCrawlConfig,
  TextCrawlEffectType,
  TextCrawlFrameType
} from './textCrawl';
import { createTextCrawlHtml } from './textCrawl';
import { resolvePresentationThemeType, type PresentationThemeType } from './theme';

export type PresentationStyleType = PresentationThemeType;
export type OverlayPlacement = 'start' | 'center' | 'end';
export type SceneTransitionPresetType = 'bulkhead' | 'quick-alert' | 'silent-fade';
export type SceneTransitionMotionType = 'split-door' | 'horizontal-shutter' | 'fade';

export type SceneSelector = {
  name: string;
};

export type BriefingLineConfig = {
  text: string;
  fontSize?: string;
};

export type BriefingLayoutConfig = {
  align?: TextCrawlAlignment;
  textAlign?: TextCrawlAlignment;
  maxWidth?: string;
  offset?: {
    x?: string;
    y?: string;
  };
};

export type BriefingAnimationConfig = {
  type?: TextCrawlEffectType;
  durationMs?: number;
  lineDelayMs?: number;
  loop?: boolean;
  separator?: string;
};

export type BriefingConfig = {
  frame?: TextCrawlFrameType;
  style?: PresentationStyleType;
  layout?: BriefingLayoutConfig;
  animation?: BriefingAnimationConfig;
  lines: BriefingLineConfig[];
  glitch?: { cycleMs: number } | false;
};

export type SceneTransitionVisualConfig = {
  type?: SceneTransitionMotionType;
  style?: PresentationStyleType;
};

export type SceneTransitionAudioOverrideConfig = {
  close?: string;
  seal?: string;
  unlock?: string;
  open?: string;
  typing?: string;
};

export type SceneTransitionAudioConfig = {
  profile?: SceneTransitionSoundProfileType;
  volume?: {
    doors?: number;
    typing?: number;
  };
  overrides?: SceneTransitionAudioOverrideConfig;
};

export type SceneTransitionTimelineConfig = {
  closeMs?: number;
  briefingMs?: number;
  unlockMs?: number;
  openMs?: number;
  fadeOutMs?: number;
  fadeInMs?: number;
  textFadeMs?: number;
  sceneReadyTimeoutMs?: number;
};

export type SceneTransitionBehaviorConfig = {
  aboveUi?: boolean;
  blockInteractions?: boolean;
  escape?: 'skip-local';
};

export type TransitionToSceneConfig = {
  scene: SceneSelector;
  id?: string;
  preset?: SceneTransitionPresetType;
  transition?: SceneTransitionVisualConfig;
  briefing?: BriefingConfig;
  audio?: SceneTransitionAudioConfig;
  timeline?: SceneTransitionTimelineConfig;
  behavior?: SceneTransitionBehaviorConfig;
};

export type OverlayBehaviorConfig = {
  clearExisting?: boolean;
  closeAllWindows?: boolean;
  aboveUi?: boolean;
  blockInteractions?: boolean;
  fadeOnClose?: boolean;
};

export type OverlayPlacementConfig = {
  x?: OverlayPlacement;
  y?: OverlayPlacement;
};

export type ShowTextOverlayConfig = {
  id?: string;
  text: BriefingConfig;
  placement?: OverlayPlacementConfig;
  durationMs?: number;
  behavior?: OverlayBehaviorConfig;
};

export type ShowHtmlOverlayConfig = {
  id?: string;
  html: string;
  placement?: OverlayPlacementConfig;
  durationMs?: number;
  behavior?: OverlayBehaviorConfig;
};

type SceneTransitionPresetDefaults = {
  transition: Required<SceneTransitionVisualConfig>;
  audio: {
    profile: SceneTransitionSoundProfileType;
  };
  timeline: SceneTransitionTimelineConfig;
};

const sceneTransitionPresets: Record<SceneTransitionPresetType, SceneTransitionPresetDefaults> = {
  bulkhead: {
    transition: {
      type: 'split-door',
      style: 'industrial'
    },
    audio: {
      profile: 'bulkhead'
    },
    timeline: {
      closeMs: 2600,
      unlockMs: 1500,
      openMs: 4100,
      textFadeMs: 900
    }
  },
  'quick-alert': {
    transition: {
      type: 'horizontal-shutter',
      style: 'alert'
    },
    audio: {
      profile: 'alert'
    },
    timeline: {
      closeMs: 1200,
      unlockMs: 400,
      openMs: 1400,
      textFadeMs: 500
    }
  },
  'silent-fade': {
    transition: {
      type: 'fade',
      style: 'clean'
    },
    audio: {
      profile: 'silent'
    },
    timeline: {
      fadeOutMs: 1000,
      fadeInMs: 1000,
      textFadeMs: 600
    }
  }
};

export const transitionToScene = (socket: ModuleSocket) => {
  const playTransition = playSceneTransition(socket);

  return (config: TransitionToSceneConfig) => {
    return playTransition(toSceneTransitionConfig(config));
  };
};

export const showTextOverlay = (socket: ModuleSocket) => {
  const showHtml = showHtmlOverlay(socket);

  return async (config: ShowTextOverlayConfig) => {
    if (!config.text) {
      throw new Error('Text overlay config.text is required.');
    }

    const html = await createTextCrawlHtml(toTextCrawlConfig(config.text));
    return showHtml({
      id: config.id,
      html,
      placement: config.placement,
      durationMs: config.durationMs,
      behavior: config.behavior
    });
  };
};

export const showHtmlOverlay = (socket: ModuleSocket) => {
  const showOverlay = createOverlay(socket);

  return (config: ShowHtmlOverlayConfig) => {
    validateHtmlOverlayConfig(config);
    return showOverlay(toOverlayConfig(config), config.html);
  };
};

const toSceneTransitionConfig = (config: TransitionToSceneConfig): SceneTransitionConfig => {
  validateTransitionToSceneConfig(config);
  const preset = sceneTransitionPresets[resolvePresetType(config.preset)];
  const transitionType = config.transition?.type ?? preset.transition.type;
  const transitionStyle = config.transition?.style ?? preset.transition.style;
  const audio = config.audio;

  return {
    sceneName: config.scene.name,
    id: config.id,
    transition: {
      type: toLegacyTransitionType(transitionType),
      theme: {
        type: resolvePresentationThemeType(transitionStyle)
      }
    },
    soundProfile: {
      type: audio?.profile ?? preset.audio.profile
    },
    text: config.briefing ? toTextCrawlConfig(config.briefing) : undefined,
    timing: toSceneTransitionTiming({
      ...preset.timeline,
      ...config.timeline
    }),
    sounds: toSceneTransitionSounds(audio),
    aboveUi: config.behavior?.aboveUi,
    blockInteractions: config.behavior?.blockInteractions
  };
};

const toTextCrawlConfig = (config: BriefingConfig): TextCrawlConfig => {
  const animation = config.animation;
  const layout = config.layout;
  const isTypewriterAnimation = !animation?.type || animation.type === 'typewriter';

  return {
    offsetX: layout?.offset?.x,
    offsetY: layout?.offset?.y,
    alignX: layout?.align,
    textAlign: layout?.textAlign,
    maxWidth: layout?.maxWidth,
    typingTime: isTypewriterAnimation && animation?.durationMs !== undefined
      ? msToSeconds(animation.durationMs)
      : undefined,
    delay: isTypewriterAnimation && animation?.lineDelayMs !== undefined
      ? msToSeconds(animation.lineDelayMs)
      : undefined,
    frame: config.frame ? { type: config.frame } : undefined,
    theme: config.style ? { type: resolvePresentationThemeType(config.style) } : undefined,
    effect: animation
      ? {
          type: animation.type,
          duration: animation.durationMs !== undefined ? msToSeconds(animation.durationMs) : undefined,
          lineDelay: animation.lineDelayMs !== undefined ? msToSeconds(animation.lineDelayMs) : undefined,
          loop: animation.loop,
          separator: animation.separator
        }
      : undefined,
    lines: config.lines,
    glitchEffect: config.glitch
      ? {
          time: msToSeconds(config.glitch.cycleMs)
        }
      : config.glitch
  };
};

const toSceneTransitionTiming = (config: SceneTransitionTimelineConfig): SceneTransitionTiming => {
  return {
    doorCloseMs: config.closeMs,
    briefingMs: config.briefingMs,
    doorUnlockMs: config.unlockMs,
    doorOpenMs: config.openMs,
    fadeOutMs: config.fadeOutMs,
    fadeInMs: config.fadeInMs,
    textFadeMs: config.textFadeMs,
    sceneReadyTimeoutMs: config.sceneReadyTimeoutMs
  };
};

const toSceneTransitionSounds = (config?: SceneTransitionAudioConfig): SceneTransitionSounds | undefined => {
  if (!config?.overrides && !config?.volume) {
    return undefined;
  }

  return {
    doorClose: config.overrides?.close,
    doorSeal: config.overrides?.seal,
    doorUnlock: config.overrides?.unlock,
    doorOpen: config.overrides?.open,
    typingClick: config.overrides?.typing,
    doorVolume: config.volume?.doors,
    typingVolume: config.volume?.typing
  };
};

const toOverlayConfig = (config: ShowHtmlOverlayConfig): OverlayConfig => {
  return {
    id: config.id,
    positionX: config.placement?.x,
    positionY: config.placement?.y,
    closeTime: config.durationMs !== undefined ? msToSeconds(config.durationMs) : undefined,
    fadeOnClose: config.behavior?.fadeOnClose,
    closeAllWindows: config.behavior?.closeAllWindows,
    clearExisting: config.behavior?.clearExisting,
    aboveUi: config.behavior?.aboveUi,
    blockInteractions: config.behavior?.blockInteractions
  };
};

const validateTransitionToSceneConfig = (config: TransitionToSceneConfig) => {
  if (!config.scene?.name?.trim()) {
    throw new Error('Scene transition scene.name is required.');
  }

  resolvePresetType(config.preset);

  if (config.transition?.type) {
    resolveTransitionMotionType(config.transition.type);
  }

  if (config.behavior?.escape && config.behavior.escape !== 'skip-local') {
    throw new Error('Scene transition behavior.escape currently only supports "skip-local".');
  }
};

const validateHtmlOverlayConfig = (config: ShowHtmlOverlayConfig) => {
  if (typeof config.html !== 'string') {
    throw new Error('HTML overlay config.html must be a string.');
  }
};

const resolvePresetType = (preset?: string): SceneTransitionPresetType => {
  const resolvedPreset = preset ?? 'bulkhead';
  if (resolvedPreset === 'bulkhead' || resolvedPreset === 'quick-alert' || resolvedPreset === 'silent-fade') {
    return resolvedPreset;
  }

  throw new Error(`Unknown scene transition preset "${resolvedPreset}". Expected "bulkhead", "quick-alert", or "silent-fade".`);
};

const resolveTransitionMotionType = (transitionType: string): SceneTransitionMotionType => {
  if (
    transitionType === 'split-door'
    || transitionType === 'horizontal-shutter'
    || transitionType === 'fade'
  ) {
    return transitionType;
  }

  throw new Error(`Unknown scene transition type "${transitionType}". Expected "split-door", "horizontal-shutter", or "fade".`);
};

const toLegacyTransitionType = (transitionType: SceneTransitionMotionType): SceneTransitionType => {
  if (transitionType === 'split-door') {
    return 'industrial-doors';
  }

  return transitionType;
};

const msToSeconds = (milliseconds: number) => milliseconds / 1000;
