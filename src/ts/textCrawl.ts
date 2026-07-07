import {moduleId} from "./constants";

export type TextCrawlFrameType =
  | 'none'
  | 'cinematic-bars'
  | 'horizontal-bar'
  | 'lower-third'
  | 'terminal-panel'
  | 'alert-banner'
  | 'chyron'
  | 'mission-card'
  | 'scanline-panel';
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

export type TextCrawlConfig = {
  offsetX?: string;
  offsetY?: string;
  alignX?: TextCrawlAlignment;
  textAlign?: TextCrawlAlignment;
  maxWidth?: string;
  typingTime?: number;
  delay?: number;
  frame?: TextCrawlFrameConfig;
  effect?: TextCrawlEffectConfig;
  lines: TextCrawlLineConfig[];
  glitchEffect?: { time: number } | false;
};

type NormalizedTextCrawlLineConfig = Required<TextCrawlLineConfig>;

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
  effect: NormalizedTextCrawlEffectConfig;
  frameTypeClass: string;
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
    || resolvedFrameType === 'terminal-panel'
    || resolvedFrameType === 'alert-banner'
    || resolvedFrameType === 'chyron'
    || resolvedFrameType === 'mission-card'
    || resolvedFrameType === 'scanline-panel'
  ) {
    return resolvedFrameType;
  }

  throw new Error(`Unknown text crawl frame type "${resolvedFrameType}". Expected "none", "cinematic-bars", "horizontal-bar", "lower-third", "terminal-panel", "alert-banner", "chyron", "mission-card", or "scanline-panel".`);
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
  resolveTextCrawlAlignment(config.alignX, 'alignX');
  resolveTextCrawlAlignment(config.textAlign, 'textAlign');
  validateTextCrawlEffectConfig(config.effect);
  validateTextCrawlEffectFrameCompatibility(frameType, effectType);
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

export const isTextCrawlTypewriterEffect = (config: TextCrawlConfig) => {
  const frameType = resolveTextCrawlFrameType(config.frame?.type);
  return resolveTextCrawlEffectType(config.effect?.type, frameType) === 'typewriter';
};

export const getTextCrawlDisplayDurationMs = (text?: TextCrawlConfig) => {
  if (!text?.lines.length) {
    return 1500;
  }

  const frameType = resolveTextCrawlFrameType(text.frame?.type);
  const effectType = resolveTextCrawlEffectType(text.effect?.type, frameType);
  validateTextCrawlEffectConfig(text.effect);
  validateTextCrawlEffectFrameCompatibility(frameType, effectType);

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
  const alignX = resolveTextCrawlAlignment(config.alignX, 'alignX');
  const textAlign = resolveTextCrawlAlignment(config.textAlign, 'textAlign');
  validateTextCrawlEffectConfig(config.effect);
  validateTextCrawlEffectFrameCompatibility(frameType, effectType);
  const effect = {
    type: effectType,
    duration: config.effect?.duration ?? getDefaultEffectDurationSeconds(effectType),
    lineDelay: config.effect?.lineDelay ?? getDefaultEffectLineDelaySeconds(effectType),
    loop: config.effect?.loop ?? effectType === 'scroll',
    separator: config.effect?.separator ?? defaultScrollSeparator
  };

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
    effect,
    frameTypeClass: `text-crawl--${frameType}`,
    effectTypeClass: `text-crawl--effect-${effectType}`,
    isScrollEffect: effectType === 'scroll',
    isTypewriterEffect: effectType === 'typewriter',
    isStaticEffect: effectType === 'none',
    showCinematicBars: frameType === 'cinematic-bars',
    scrollDuration: effect.duration,
    scrollIterationCount: effect.loop ? 'infinite' : '1',
    lineEffectDuration: effect.duration,
    lines: config.lines.map(line => ({text: line.text, fontSize: line.fontSize ?? '32px'})),
    glitchEffect: config.glitchEffect ?? false
  };
}

const validateTextCrawlEffectConfig = (effect?: TextCrawlEffectConfig) => {
  if (!effect) {
    return;
  }

  if (effect.duration !== undefined && (!Number.isFinite(effect.duration) || effect.duration <= 0)) {
    throw new Error('Text crawl effect duration must be a positive number of seconds.');
  }

  if (effect.lineDelay !== undefined && (!Number.isFinite(effect.lineDelay) || effect.lineDelay < 0)) {
    throw new Error('Text crawl effect lineDelay must be a non-negative number of seconds.');
  }
};

const validateTextCrawlEffectFrameCompatibility = (
  frameType: TextCrawlFrameType,
  effectType: TextCrawlEffectType
) => {
  if (effectType !== 'scroll' || isScrollCompatibleFrameType(frameType)) {
    return;
  }

  throw new Error('Text crawl effect "scroll" is only supported with frame types "chyron", "horizontal-bar", or "alert-banner".');
};

const isScrollCompatibleFrameType = (frameType: TextCrawlFrameType) => {
  return frameType === 'chyron' || frameType === 'horizontal-bar' || frameType === 'alert-banner';
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
