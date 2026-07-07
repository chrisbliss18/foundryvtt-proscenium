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
  TextCrawlFrameType,
  TextCrawlSenderConfig,
  TextCrawlSenderImageFit,
  TextCrawlSenderImageShape,
  TextCrawlSenderPosition,
  TextCrawlSenderSize
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

export type BriefingSenderActorImageType = 'portrait' | 'token';

export type BriefingSenderActorSelector = {
  uuid?: string;
  name?: string;
  image?: BriefingSenderActorImageType;
};

export type BriefingSenderConfig = {
  name?: string;
  label?: string;
  subtitle?: string;
  image?: string;
  imageFit?: TextCrawlSenderImageFit;
  imageShape?: TextCrawlSenderImageShape;
  position?: TextCrawlSenderPosition;
  size?: TextCrawlSenderSize;
  actor?: BriefingSenderActorSelector;
};

export type BriefingConfig = {
  frame?: TextCrawlFrameType;
  style?: PresentationStyleType;
  layout?: BriefingLayoutConfig;
  animation?: BriefingAnimationConfig;
  lines: BriefingLineConfig[];
  glitch?: { cycleMs: number } | false;
  sender?: BriefingSenderConfig;
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

type FoundryActorLike = {
  documentName?: string;
  id?: string;
  uuid?: string;
  name?: string;
  img?: string;
  thumbnail?: string;
  prototypeToken?: {
    texture?: {
      src?: string;
    };
  };
};

type FoundryTokenLike = {
  documentName?: string;
  id?: string;
  uuid?: string;
  name?: string;
  actor?: FoundryActorLike | null;
  texture?: {
    src?: string;
  };
};

type FoundryActorCollectionLike = {
  contents?: FoundryActorLike[];
  filter?: (predicate: (actor: FoundryActorLike) => boolean) => FoundryActorLike[];
  getName?: (name: string) => FoundryActorLike | null | undefined;
  [Symbol.iterator]?: () => IterableIterator<FoundryActorLike>;
};

type FoundryUuidGlobal = typeof globalThis & {
  fromUuid?: (uuid: string) => Promise<unknown | null>;
};

type ResolvedSenderActor = {
  name?: string;
  portraitImage?: string;
  tokenImage?: string;
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

  return async (config: TransitionToSceneConfig) => {
    const transitionConfig = await preparePublicConfig(() => toSceneTransitionConfig(config));
    return playTransition(transitionConfig);
  };
};

export const showTextOverlay = (socket: ModuleSocket) => {
  const showHtml = showHtmlOverlay(socket);

  return async (config: ShowTextOverlayConfig) => {
    if (!config.text) {
      throw new Error('Text overlay config.text is required.');
    }

    const textConfig = await preparePublicConfig(() => toTextCrawlConfig(config.text));
    const html = await preparePublicConfig(() => createTextCrawlHtml(textConfig));
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

const toSceneTransitionConfig = async (config: TransitionToSceneConfig): Promise<SceneTransitionConfig> => {
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
    text: config.briefing ? await toTextCrawlConfig(config.briefing) : undefined,
    timing: toSceneTransitionTiming({
      ...preset.timeline,
      ...config.timeline
    }),
    sounds: toSceneTransitionSounds(audio),
    aboveUi: config.behavior?.aboveUi,
    blockInteractions: config.behavior?.blockInteractions
  };
};

const toTextCrawlConfig = async (config: BriefingConfig): Promise<TextCrawlConfig> => {
  const animation = config.animation;
  const layout = config.layout;
  const isTypewriterAnimation = !animation?.type || animation.type === 'typewriter';
  const sender = await resolveBriefingSender(config.sender);

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
      : config.glitch,
    sender
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

const preparePublicConfig = async <T>(prepare: () => Promise<T>): Promise<T> => {
  try {
    return await prepare();
  } catch (error) {
    notifyApiError(error);
    throw error;
  }
};

const resolveBriefingSender = async (sender?: BriefingSenderConfig): Promise<TextCrawlSenderConfig | undefined> => {
  if (!sender) {
    return undefined;
  }

  const actor = sender.actor ? await resolveSenderActor(sender.actor) : undefined;
  const name = sender.name?.trim() || actor?.name;
  if (!name) {
    throw new Error('Briefing sender requires either sender.name or sender.actor.');
  }

  const manualImage = isActorImageSelector(sender.image) && sender.actor
    ? undefined
    : sender.image?.trim();
  const actorImageType = sender.actor?.image ?? (isActorImageSelector(sender.image) ? sender.image : 'portrait');
  const actorImage = actorImageType === 'token'
    ? actor?.tokenImage
    : actor?.portraitImage;

  return {
    name,
    label: sender.label,
    subtitle: sender.subtitle,
    image: manualImage || actorImage,
    imageFit: sender.imageFit,
    imageShape: sender.imageShape,
    position: sender.position,
    size: sender.size
  };
};

const resolveSenderActor = async (selector: BriefingSenderActorSelector): Promise<ResolvedSenderActor> => {
  if (selector.uuid) {
    return resolveSenderActorByUuid(selector.uuid);
  }

  if (selector.name) {
    return resolveSenderActorByName(selector.name);
  }

  throw new Error('Briefing sender.actor requires either actor.uuid or actor.name.');
};

const resolveSenderActorByUuid = async (uuid: string): Promise<ResolvedSenderActor> => {
  const trimmedUuid = uuid.trim();
  if (!trimmedUuid) {
    throw new Error('Briefing sender.actor.uuid must be a non-empty string.');
  }

  const fromUuid = (globalThis as FoundryUuidGlobal).fromUuid;
  if (typeof fromUuid !== 'function') {
    throw new Error('Unable to resolve briefing sender actor UUID: fromUuid is not available.');
  }

  const document = await fromUuid(trimmedUuid);
  if (!document) {
    throw new Error(`Unable to find briefing sender actor with UUID "${trimmedUuid}".`);
  }

  const actor = toResolvedSenderActor(document);
  if (!actor) {
    throw new Error(`Briefing sender UUID "${trimmedUuid}" did not resolve to an actor or token document.`);
  }

  return actor;
};

const resolveSenderActorByName = (name: string): ResolvedSenderActor => {
  const actorName = name.trim();
  if (!actorName) {
    throw new Error('Briefing sender.actor.name must be a non-empty string.');
  }

  const actors = (game as ReadyGame).actors as unknown as FoundryActorCollectionLike | undefined;
  if (!actors) {
    throw new Error('Unable to resolve briefing sender actor name: actor collection is not available.');
  }

  const actorList = getActorCollectionContents(actors);
  const matches = findActorNameMatches(actorList, actorName);
  if (matches.length === 1) {
    return resolvedSenderActorFromActor(matches[0]);
  }
  if (matches.length > 1) {
    throw new Error(`Briefing sender actor name "${actorName}" matches ${matches.length} actors. Use sender.actor.uuid or rename duplicate actors.`);
  }

  const getNameMatch = actors.getName?.(actorName);
  if (getNameMatch) {
    return resolvedSenderActorFromActor(getNameMatch);
  }

  if (matches.length === 0) {
    throw new Error(createActorNotFoundMessage(actorName, actorList));
  }

  throw new Error(`Unable to resolve briefing sender actor named "${actorName}".`);
};

const getActorCollectionContents = (actors: FoundryActorCollectionLike): FoundryActorLike[] => {
  const actorList: FoundryActorLike[] = [];

  if (Array.isArray(actors.contents)) {
    actorList.push(...actors.contents);
  }

  if (typeof actors.filter === 'function') {
    actorList.push(...actors.filter(() => true));
  }

  const iterator = actors[Symbol.iterator];
  if (typeof iterator === 'function') {
    actorList.push(...Array.from(iterator.call(actors)));
  }

  return deduplicateActors(actorList).filter(actor => !!actor.name);
};

const findActorNameMatches = (actors: FoundryActorLike[], actorName: string): FoundryActorLike[] => {
  const exactMatches = actors.filter(actor => actor.name === actorName);
  if (exactMatches.length) {
    return exactMatches;
  }

  const normalizedActorName = normalizeActorName(actorName);
  return actors.filter(actor => normalizeActorName(actor.name) === normalizedActorName);
};

const normalizeActorName = (name?: string) => {
  return name?.trim().replace(/\s+/g, ' ').toLocaleLowerCase() ?? '';
};

const deduplicateActors = (actors: FoundryActorLike[]) => {
  const seen = new Set<FoundryActorLike | string>();
  return actors.filter(actor => {
    const key = actor.uuid || actor.id || actor;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const createActorNotFoundMessage = (actorName: string, actors: FoundryActorLike[]) => {
  const examples = actors
    .slice(0, 6)
    .map(actor => actor.name)
    .filter(Boolean)
    .join(', ');
  const suffix = examples
    ? ` Available examples: ${examples}.`
    : '';

  return `Unable to find briefing sender actor named "${actorName}".${suffix}`;
};

const toResolvedSenderActor = (document: unknown): ResolvedSenderActor | undefined => {
  if (isActorLike(document)) {
    return resolvedSenderActorFromActor(document);
  }

  if (isTokenLike(document)) {
    return resolvedSenderActorFromToken(document);
  }

  return undefined;
};

const resolvedSenderActorFromActor = (actor: FoundryActorLike): ResolvedSenderActor => {
  return {
    name: actor.name,
    portraitImage: actor.img || actor.thumbnail,
    tokenImage: actor.prototypeToken?.texture?.src || actor.img || actor.thumbnail
  };
};

const resolvedSenderActorFromToken = (token: FoundryTokenLike): ResolvedSenderActor => {
  return {
    name: token.actor?.name || token.name,
    portraitImage: token.actor?.img || token.actor?.thumbnail || token.texture?.src,
    tokenImage: token.texture?.src || token.actor?.prototypeToken?.texture?.src || token.actor?.img || token.actor?.thumbnail
  };
};

const isActorLike = (document: unknown): document is FoundryActorLike => {
  if (!document || typeof document !== 'object') {
    return false;
  }

  const actor = document as FoundryActorLike;
  return actor.documentName === 'Actor'
    || actor.prototypeToken !== undefined;
};

const isTokenLike = (document: unknown): document is FoundryTokenLike => {
  if (!document || typeof document !== 'object') {
    return false;
  }

  const token = document as FoundryTokenLike;
  return token.documentName === 'Token'
    || (token.actor !== undefined && token.texture !== undefined);
};

const isActorImageSelector = (image?: string): image is BriefingSenderActorImageType => {
  return image === 'portrait' || image === 'token';
};

const notifyApiError = (error: unknown) => {
  const message = error instanceof Error
    ? error.message
    : 'Unable to prepare Anarchist Overlay config.';
  ui.notifications?.error(`Anarchist Overlay | ${message}`);
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
