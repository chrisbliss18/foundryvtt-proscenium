import {moduleId} from "./constants";
import {
  defaultPresentationThemeType,
  resolvePresentationThemeType,
  type PresentationThemeConfig,
  type PresentationThemeType
} from './theme';

export type TextCrawlFrameType =
  | 'none'
  | 'cinematic-bars'
  | 'horizontal-bar'
  | 'lower-third'
  | 'chyron'
  | 'panel'
  | 'mission-card';
export type TextCrawlEffectType =
  | 'typewriter'
  | 'scroll'
  | 'stagger-fade'
  | 'decode'
  | 'wipe'
  | 'none';
export type TextCrawlAlignment = 'start' | 'center' | 'end';

export type TextCrawlFrameConfig = {
  type?: TextCrawlFrameType;
};

export type TextCrawlEffectConfig = {
  type?: TextCrawlEffectType;
  duration?: number;
  lineDelay?: number;
  loop?: boolean;
  separator?: string;
};

type TextCrawlLineConfig = {
  text: string;
  fontSize?: string;
};

export type TextCrawlSenderPosition = 'left' | 'right' | 'top';
export type TextCrawlSenderImageFit = 'cover' | 'contain';
export type TextCrawlSenderImageShape = 'square' | 'portrait' | 'circle';
export type TextCrawlSenderSize = 'compact' | 'normal' | 'large';

export type TextCrawlSenderConfig = {
  name: string;
  label?: string;
  sublabel?: string;
  image?: string;
  imageFit?: TextCrawlSenderImageFit;
  imageShape?: TextCrawlSenderImageShape;
  position?: TextCrawlSenderPosition;
  size?: TextCrawlSenderSize;
};

export type TextCrawlConfig = {
  offsetX?: string;
  offsetY?: string;
  alignX?: TextCrawlAlignment;
  textAlign?: TextCrawlAlignment;
  maxWidth?: string;
  typingTime?: number;
  delay?: number;
  frame?: TextCrawlFrameConfig;
  theme?: PresentationThemeConfig;
  effect?: TextCrawlEffectConfig;
  lines: TextCrawlLineConfig[];
  glitchEffect?: { time: number } | false;
  sender?: TextCrawlSenderConfig;
};

type NormalizedTextCrawlLineConfig = Required<TextCrawlLineConfig>;
type NormalizedTextCrawlSenderConfig = Required<TextCrawlSenderConfig> & {
  hasImage: boolean;
};

type NormalizedTextCrawlEffectConfig = {
  type: TextCrawlEffectType;
  duration: number;
  lineDelay: number;
  loop: boolean;
  separator: string;
};

type NormalizedConfig = {
  offsetX: string;
  offsetY: string;
  alignX: TextCrawlAlignment;
  alignXCss: string;
  textAlign: TextCrawlAlignment;
  textAlignCss: string;
  maxWidth: string;
  typingTime: number;
  delay: number;
  frame: Required<TextCrawlFrameConfig>;
  theme: Required<PresentationThemeConfig>;
  effect: NormalizedTextCrawlEffectConfig;
  frameTypeClass: string;
  themeTypeClass: string;
  effectTypeClass: string;
  isScrollEffect: boolean;
  isTypewriterEffect: boolean;
  isStaticEffect: boolean;
  showCinematicBars: boolean;
  scrollDuration: number;
  scrollIterationCount: string;
  lineEffectDuration: number;
  lines: NormalizedTextCrawlLineConfig[];
  glitchEffect: { time: number } | false;
  sender?: NormalizedTextCrawlSenderConfig;
  senderPositionClass: string;
  senderImageFitClass: string;
  senderImageShapeClass: string;
  senderSizeClass: string;
  hasSender: boolean;
};

const defaultFrameType: TextCrawlFrameType = 'cinematic-bars';
const defaultTypewriterDurationSeconds = 2;
const defaultTypewriterDelaySeconds = 1;
const defaultScrollDurationSeconds = 18;
const defaultStaticDisplaySeconds = 2.5;
const defaultScrollSeparator = ' // ';
const defaultLineEffectDurationSeconds = 0.9;
const defaultLineEffectDelaySeconds = 0.24;
const decodeCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%@&<>/\\[]{}';

export const createTextCrawlHtml = async (config: TextCrawlConfig) => {
  const normalizedConfig = normalizeConfig(config);
  return await renderTemplate(`modules/${moduleId}/templates/text-crawl.hbs`, {
    ...normalizedConfig,
    lines: normalizedConfig.lines.map((line, index) => ({
      ...line,
      typingTime: normalizedConfig.typingTime,
      textLength: line.text.length,
      cursorDelay: (normalizedConfig.typingTime + normalizedConfig.delay) * 2,
      startDelay: getLineStartDelay(normalizedConfig, index),
      isLastLine: index === normalizedConfig.lines.length - 1,
      isTypewriterEffect: normalizedConfig.isTypewriterEffect,
      isStaticEffect: normalizedConfig.isStaticEffect,
      scrambleText: createScrambleText(line.text, index),
      glitchEffect: normalizedConfig.glitchEffect
    })),
    scrollLines: normalizedConfig.lines.map(line => ({
      ...line,
      separator: normalizedConfig.effect.separator
    }))
  });
}

export const resolveTextCrawlFrameType = (frameType?: string): TextCrawlFrameType => {
  const resolvedFrameType = frameType ?? defaultFrameType;
  if (
    resolvedFrameType === 'none'
    || resolvedFrameType === 'cinematic-bars'
    || resolvedFrameType === 'horizontal-bar'
    || resolvedFrameType === 'lower-third'
    || resolvedFrameType === 'chyron'
    || resolvedFrameType === 'panel'
    || resolvedFrameType === 'mission-card'
  ) {
    return resolvedFrameType;
  }

  throw new Error(`Unknown text crawl frame type "${resolvedFrameType}". Expected "none", "cinematic-bars", "horizontal-bar", "lower-third", "chyron", "panel", or "mission-card".`);
};

export const resolveTextCrawlEffectType = (
  effectType?: string,
  frameType: TextCrawlFrameType = defaultFrameType
): TextCrawlEffectType => {
  const resolvedEffectType = effectType ?? (frameType === 'chyron' ? 'scroll' : 'typewriter');
  if (
    resolvedEffectType === 'typewriter'
    || resolvedEffectType === 'scroll'
    || resolvedEffectType === 'stagger-fade'
    || resolvedEffectType === 'decode'
    || resolvedEffectType === 'wipe'
    || resolvedEffectType === 'none'
  ) {
    return resolvedEffectType;
  }

  throw new Error(`Unknown text crawl effect type "${resolvedEffectType}". Expected "typewriter", "scroll", "stagger-fade", "decode", "wipe", or "none".`);
};

export const validateTextCrawlConfig = (config: TextCrawlConfig) => {
  const frameType = resolveTextCrawlFrameType(config.frame?.type);
  const effectType = resolveTextCrawlEffectType(config.effect?.type, frameType);
  resolveTextCrawlThemeType(config.theme?.type, frameType);
  resolveTextCrawlAlignment(config.alignX, 'alignX');
  resolveTextCrawlAlignment(config.textAlign, 'textAlign');
  validateTextCrawlLayoutConfig(config);
  validateTextCrawlTimingConfig(config);
  validateTextCrawlEffectConfig(config.effect);
  validateTextCrawlGlitchConfig(config);
  validateTextCrawlSenderConfig(config.sender);
  validateTextCrawlEffectFrameCompatibility(frameType, effectType);
  validateTextCrawlLines(config);
};

const resolveTextCrawlAlignment = (
  alignment: string | undefined,
  fieldName: 'alignX' | 'textAlign'
): TextCrawlAlignment => {
  const resolvedAlignment = alignment ?? 'start';
  if (resolvedAlignment === 'start' || resolvedAlignment === 'center' || resolvedAlignment === 'end') {
    return resolvedAlignment;
  }

  throw new Error(`Unknown text crawl ${fieldName} value "${resolvedAlignment}". Expected "start", "center", or "end".`);
};

const getCssAlignment = (alignment: TextCrawlAlignment) => {
  if (alignment === 'center') {
    return 'center';
  }

  return alignment === 'end' ? 'flex-end' : 'flex-start';
};

const resolveTextCrawlThemeType = (
  themeType: string | undefined,
  frameType: TextCrawlFrameType
): PresentationThemeType => {
  return resolvePresentationThemeType(
    themeType,
    getDefaultTextCrawlThemeType(frameType)
  );
};

export const isTextCrawlTypewriterEffect = (config: TextCrawlConfig) => {
  const frameType = resolveTextCrawlFrameType(config.frame?.type);
  return resolveTextCrawlEffectType(config.effect?.type, frameType) === 'typewriter';
};

export const getTextCrawlThemeType = (config: TextCrawlConfig) => {
  const frameType = resolveTextCrawlFrameType(config.frame?.type);
  return resolveTextCrawlThemeType(config.theme?.type, frameType);
};

export const getTextCrawlDisplayDurationMs = (text?: TextCrawlConfig) => {
  if (!text?.lines.length) {
    return 1500;
  }

  const frameType = resolveTextCrawlFrameType(text.frame?.type);
  const effectType = resolveTextCrawlEffectType(text.effect?.type, frameType);
  resolveTextCrawlThemeType(text.theme?.type, frameType);
  validateTextCrawlLayoutConfig(text);
  validateTextCrawlTimingConfig(text);
  validateTextCrawlEffectConfig(text.effect);
  validateTextCrawlGlitchConfig(text);
  validateTextCrawlSenderConfig(text.sender);
  validateTextCrawlEffectFrameCompatibility(frameType, effectType);
  validateTextCrawlLines(text);

  if (effectType === 'scroll') {
    return ((text.effect?.duration ?? defaultScrollDurationSeconds) + 1) * 1000;
  }

  if (effectType === 'none') {
    return Math.max(defaultStaticDisplaySeconds, text.lines.length * 0.8) * 1000;
  }

  if (isLineAnimationEffect(effectType)) {
    const duration = text.effect?.duration ?? getDefaultEffectDurationSeconds(effectType);
    const lineDelay = text.effect?.lineDelay ?? getDefaultEffectLineDelaySeconds(effectType);
    return (((text.lines.length - 1) * lineDelay) + duration + 1) * 1000;
  }

  const typingTime = text.typingTime ?? defaultTypewriterDurationSeconds;
  const delay = text.delay ?? defaultTypewriterDelaySeconds;
  const totalSeconds = ((text.lines.length - 1) * (typingTime + delay)) + typingTime + 1;
  return totalSeconds * 1000;
};

const normalizeConfig = (config: TextCrawlConfig): NormalizedConfig => {
  const frameType = resolveTextCrawlFrameType(config.frame?.type);
  const effectType = resolveTextCrawlEffectType(config.effect?.type, frameType);
  const themeType = resolveTextCrawlThemeType(config.theme?.type, frameType);
  const alignX = resolveTextCrawlAlignment(config.alignX, 'alignX');
  const textAlign = resolveTextCrawlAlignment(config.textAlign, 'textAlign');
  validateTextCrawlLayoutConfig(config);
  validateTextCrawlTimingConfig(config);
  validateTextCrawlEffectConfig(config.effect);
  validateTextCrawlGlitchConfig(config);
  validateTextCrawlSenderConfig(config.sender);
  validateTextCrawlEffectFrameCompatibility(frameType, effectType);
  validateTextCrawlLines(config);
  const effect = {
    type: effectType,
    duration: config.effect?.duration ?? getDefaultEffectDurationSeconds(effectType),
    lineDelay: config.effect?.lineDelay ?? getDefaultEffectLineDelaySeconds(effectType),
    loop: config.effect?.loop ?? effectType === 'scroll',
    separator: config.effect?.separator ?? defaultScrollSeparator
  };

  const sender = normalizeSenderConfig(config.sender);

  return {
    offsetX: config.offsetX ?? '0',
    offsetY: config.offsetY ?? '0',
    alignX,
    alignXCss: getCssAlignment(alignX),
    textAlign,
    textAlignCss: getCssAlignment(textAlign),
    maxWidth: config.maxWidth ?? 'max-content',
    typingTime: config.typingTime ?? defaultTypewriterDurationSeconds,
    delay: config.delay ?? defaultTypewriterDelaySeconds,
    frame: {
      type: frameType
    },
    theme: {
      type: themeType
    },
    effect,
    frameTypeClass: `text-crawl--${frameType}`,
    themeTypeClass: `text-crawl--theme-${themeType}`,
    effectTypeClass: `text-crawl--effect-${effectType}`,
    isScrollEffect: effectType === 'scroll',
    isTypewriterEffect: effectType === 'typewriter',
    isStaticEffect: effectType === 'none',
    showCinematicBars: frameType === 'cinematic-bars',
    scrollDuration: effect.duration,
    scrollIterationCount: effect.loop ? 'infinite' : '1',
    lineEffectDuration: effect.duration,
    lines: config.lines.map(line => ({text: line.text, fontSize: line.fontSize ?? '32px'})),
    glitchEffect: config.glitchEffect ?? false,
    sender,
    senderPositionClass: sender ? `text-crawl--sender-${sender.position}` : '',
    senderImageFitClass: sender ? `text-crawl--sender-image-${sender.imageFit}` : '',
    senderImageShapeClass: sender ? `text-crawl--sender-shape-${sender.imageShape}` : '',
    senderSizeClass: sender ? `text-crawl--sender-size-${sender.size}` : '',
    hasSender: !!sender
  };
}

const validateTextCrawlEffectConfig = (effect?: TextCrawlEffectConfig) => {
  if (!effect) {
    return;
  }

  if (effect.loop !== undefined && typeof effect.loop !== 'boolean') {
    throw new Error('Text crawl effect loop must be true or false.');
  }

  if (effect.separator !== undefined && typeof effect.separator !== 'string') {
    throw new Error('Text crawl effect separator must be a string.');
  }

  if (effect.duration !== undefined && (!Number.isFinite(effect.duration) || effect.duration <= 0)) {
    throw new Error('Text crawl effect duration must be a positive number of seconds.');
  }

  if (effect.lineDelay !== undefined && (!Number.isFinite(effect.lineDelay) || effect.lineDelay < 0)) {
    throw new Error('Text crawl effect lineDelay must be a non-negative number of seconds.');
  }
};

const validateTextCrawlLayoutConfig = (config: TextCrawlConfig) => {
  validateOptionalTextCssString(config.offsetX, 'offsetX');
  validateOptionalTextCssString(config.offsetY, 'offsetY');
  validateOptionalTextCssString(config.maxWidth, 'maxWidth');
};

const validateTextCrawlTimingConfig = (config: TextCrawlConfig) => {
  if (config.typingTime !== undefined && (!Number.isFinite(config.typingTime) || config.typingTime <= 0)) {
    throw new Error('Text crawl typingTime must be a positive number of seconds.');
  }

  if (config.delay !== undefined && (!Number.isFinite(config.delay) || config.delay < 0)) {
    throw new Error('Text crawl delay must be a non-negative number of seconds.');
  }
};

const validateTextCrawlGlitchConfig = (config: TextCrawlConfig) => {
  if (config.glitchEffect === undefined || config.glitchEffect === false) {
    return;
  }

  if (
    !config.glitchEffect
    || typeof config.glitchEffect !== 'object'
    || !Number.isFinite(config.glitchEffect.time)
    || config.glitchEffect.time <= 0
  ) {
    throw new Error('Text crawl glitchEffect must be false or an object with a positive time value in seconds.');
  }
};

const validateTextCrawlSenderConfig = (sender?: TextCrawlSenderConfig) => {
  if (!sender) {
    return;
  }

  if (typeof sender.name !== 'string' || !sender.name.trim()) {
    throw new Error('Text crawl sender.name must be a non-empty string.');
  }

  if (sender.label !== undefined && (typeof sender.label !== 'string' || !sender.label.trim())) {
    throw new Error('Text crawl sender.label must be a non-empty string.');
  }

  if (sender.sublabel !== undefined && (typeof sender.sublabel !== 'string' || !sender.sublabel.trim())) {
    throw new Error('Text crawl sender.sublabel must be a non-empty string.');
  }

  if (sender.image !== undefined && (typeof sender.image !== 'string' || !sender.image.trim())) {
    throw new Error('Text crawl sender.image must be a non-empty string.');
  }

  resolveTextCrawlSenderPosition(sender.position);
  resolveTextCrawlSenderImageFit(sender.imageFit);
  resolveTextCrawlSenderImageShape(sender.imageShape);
  resolveTextCrawlSenderSize(sender.size);
};

const validateTextCrawlLines = (config: TextCrawlConfig) => {
  if (!Array.isArray(config.lines) || config.lines.length === 0) {
    throw new Error('Text crawl lines must contain at least one line.');
  }

  config.lines.forEach((line, index) => {
    if (!line || typeof line.text !== 'string' || !line.text.trim()) {
      throw new Error(`Text crawl line ${index + 1} must include non-empty text.`);
    }

    if (line.fontSize !== undefined && (typeof line.fontSize !== 'string' || !line.fontSize.trim())) {
      throw new Error(`Text crawl line ${index + 1} fontSize must be a non-empty CSS size string.`);
    }
  });
};

const validateOptionalTextCssString = (value: string | undefined, fieldName: string) => {
  if (value !== undefined && (typeof value !== 'string' || !value.trim())) {
    throw new Error(`Text crawl ${fieldName} must be a non-empty CSS value string.`);
  }
};

const normalizeSenderConfig = (sender?: TextCrawlSenderConfig): NormalizedTextCrawlSenderConfig | undefined => {
  if (!sender) {
    return undefined;
  }

  const image = sender.image?.trim() ?? '';

  return {
    name: sender.name.trim(),
    label: sender.label?.trim() ?? 'TRANSMISSION SOURCE',
    sublabel: sender.sublabel?.trim() ?? '',
    image,
    imageFit: resolveTextCrawlSenderImageFit(sender.imageFit),
    imageShape: resolveTextCrawlSenderImageShape(sender.imageShape),
    position: resolveTextCrawlSenderPosition(sender.position),
    size: resolveTextCrawlSenderSize(sender.size),
    hasImage: !!image
  };
};

const resolveTextCrawlSenderPosition = (position?: string): TextCrawlSenderPosition => {
  const resolvedPosition = position ?? 'left';
  if (resolvedPosition === 'left' || resolvedPosition === 'right' || resolvedPosition === 'top') {
    return resolvedPosition;
  }

  throw new Error(`Unknown text crawl sender.position value "${resolvedPosition}". Expected "left", "right", or "top".`);
};

const resolveTextCrawlSenderImageFit = (imageFit?: string): TextCrawlSenderImageFit => {
  const resolvedImageFit = imageFit ?? 'cover';
  if (resolvedImageFit === 'cover' || resolvedImageFit === 'contain') {
    return resolvedImageFit;
  }

  throw new Error(`Unknown text crawl sender.imageFit value "${resolvedImageFit}". Expected "cover" or "contain".`);
};

const resolveTextCrawlSenderImageShape = (imageShape?: string): TextCrawlSenderImageShape => {
  const resolvedImageShape = imageShape ?? 'square';
  if (resolvedImageShape === 'square' || resolvedImageShape === 'portrait' || resolvedImageShape === 'circle') {
    return resolvedImageShape;
  }

  throw new Error(`Unknown text crawl sender.imageShape value "${resolvedImageShape}". Expected "square", "portrait", or "circle".`);
};

const resolveTextCrawlSenderSize = (size?: string): TextCrawlSenderSize => {
  const resolvedSize = size ?? 'normal';
  if (resolvedSize === 'compact' || resolvedSize === 'normal' || resolvedSize === 'large') {
    return resolvedSize;
  }

  throw new Error(`Unknown text crawl sender.size value "${resolvedSize}". Expected "compact", "normal", or "large".`);
};

const validateTextCrawlEffectFrameCompatibility = (
  frameType: TextCrawlFrameType,
  effectType: TextCrawlEffectType
) => {
  if (effectType !== 'scroll' || isScrollCompatibleFrameType(frameType)) {
    return;
  }

  throw new Error('Text crawl effect "scroll" is only supported with frame types "chyron" or "horizontal-bar".');
};

const isScrollCompatibleFrameType = (frameType: TextCrawlFrameType) => {
  return frameType === 'chyron' || frameType === 'horizontal-bar';
};

const getDefaultTextCrawlThemeType = (frameType: TextCrawlFrameType): PresentationThemeType => {
  if (frameType === 'panel' || frameType === 'chyron') {
    return 'terminal';
  }
  if (frameType === 'none' || frameType === 'cinematic-bars') {
    return 'clean';
  }

  return defaultPresentationThemeType;
};

const getDefaultEffectDurationSeconds = (effectType: TextCrawlEffectType) => {
  if (effectType === 'scroll') {
    return defaultScrollDurationSeconds;
  }
  if (effectType === 'decode') {
    return 1.15;
  }
  if (effectType === 'wipe') {
    return 0.85;
  }
  if (effectType === 'stagger-fade') {
    return 0.75;
  }

  return defaultLineEffectDurationSeconds;
};

const getDefaultEffectLineDelaySeconds = (effectType: TextCrawlEffectType) => {
  if (effectType === 'decode') {
    return 0.22;
  }
  if (effectType === 'wipe') {
    return 0.18;
  }
  if (effectType === 'stagger-fade') {
    return 0.28;
  }

  return defaultLineEffectDelaySeconds;
};

const getLineStartDelay = (config: NormalizedConfig, index: number) => {
  if (config.isTypewriterEffect) {
    return (config.delay + config.typingTime) * index;
  }

  if (isLineAnimationEffect(config.effect.type)) {
    return config.effect.lineDelay * index;
  }

  return 0;
};

const isLineAnimationEffect = (effectType: TextCrawlEffectType) => {
  return effectType === 'stagger-fade' || effectType === 'decode' || effectType === 'wipe';
};

const createScrambleText = (text: string, lineIndex: number) => {
  return Array.from(text, (character, characterIndex) => {
    if (character.trim() === '') {
      return character;
    }

    const scrambleIndex = ((lineIndex + 1) * 17 + characterIndex * 7) % decodeCharacters.length;
    return decodeCharacters.charAt(scrambleIndex);
  }).join('');
};
