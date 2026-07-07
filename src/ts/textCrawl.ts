import {moduleId} from "./constants";

export type TextCrawlFrameType =
  | 'none'
  | 'cinematic-bars'
  | 'horizontal-bar'
  | 'lower-third'
  | 'terminal-panel'
  | 'alert-banner';
export type TextCrawlAlignment = 'start' | 'center' | 'end';

export type TextCrawlFrameConfig = {
  type?: TextCrawlFrameType;
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
  lines: TextCrawlLineConfig[];
  glitchEffect?: { time: number } | false;
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
  frameTypeClass: string;
  showCinematicBars: boolean;
  lines: Required<TextCrawlLineConfig>[];
  glitchEffect: { time: number } | false;
};

export const createTextCrawlHtml = async (config: TextCrawlConfig) => {
  const normalizedConfig = normalizeConfig(config);
  return await renderTemplate(`modules/${moduleId}/templates/text-crawl.hbs`, {
    ...normalizedConfig,
    lines: normalizedConfig.lines.map((line, index) => ({
      ...line,
      typingTime: normalizedConfig.typingTime,
      textLength: line.text.length,
      cursorDelay: (normalizedConfig.typingTime + normalizedConfig.delay) * 2,
      startDelay: (normalizedConfig.delay + normalizedConfig.typingTime) * index,
      isLastLine: index === normalizedConfig.lines.length - 1,
      glitchEffect: normalizedConfig.glitchEffect
    }))
  });
}

export const resolveTextCrawlFrameType = (frameType?: string): TextCrawlFrameType => {
  const resolvedFrameType = frameType ?? 'cinematic-bars';
  if (
    resolvedFrameType === 'none'
    || resolvedFrameType === 'cinematic-bars'
    || resolvedFrameType === 'horizontal-bar'
    || resolvedFrameType === 'lower-third'
    || resolvedFrameType === 'terminal-panel'
    || resolvedFrameType === 'alert-banner'
  ) {
    return resolvedFrameType;
  }

  throw new Error(`Unknown text crawl frame type "${resolvedFrameType}". Expected "none", "cinematic-bars", "horizontal-bar", "lower-third", "terminal-panel", or "alert-banner".`);
};

export const validateTextCrawlConfig = (config: TextCrawlConfig) => {
  resolveTextCrawlFrameType(config.frame?.type);
  resolveTextCrawlAlignment(config.alignX, 'alignX');
  resolveTextCrawlAlignment(config.textAlign, 'textAlign');
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

const normalizeConfig = (config: TextCrawlConfig): NormalizedConfig => {
  const frameType = resolveTextCrawlFrameType(config.frame?.type);
  const alignX = resolveTextCrawlAlignment(config.alignX, 'alignX');
  const textAlign = resolveTextCrawlAlignment(config.textAlign, 'textAlign');

  return {
    offsetX: config.offsetX ?? '0',
    offsetY: config.offsetY ?? '0',
    alignX,
    alignXCss: getCssAlignment(alignX),
    textAlign,
    textAlignCss: getCssAlignment(textAlign),
    maxWidth: config.maxWidth ?? 'max-content',
    typingTime: config.typingTime ?? 2,
    delay: config.delay ?? 1,
    frame: {
      type: frameType
    },
    frameTypeClass: `text-crawl--${frameType}`,
    showCinematicBars: frameType === 'cinematic-bars',
    lines: config.lines.map(line => ({text: line.text, fontSize: line.fontSize ?? '32px'})),
    glitchEffect: config.glitchEffect ?? false
  };
}
