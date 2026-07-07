import {moduleId} from "./constants";

export type TextCrawlFrameType = 'none' | 'cinematic-bars' | 'lancer-bar';

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
  typingTime?: number;
  delay?: number;
  frame?: TextCrawlFrameConfig;
  lines: TextCrawlLineConfig[];
  glitchEffect?: { time: number } | false;
};

type NormalizedConfig = {
  offsetX: string;
  offsetY: string;
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
  if (resolvedFrameType === 'none' || resolvedFrameType === 'cinematic-bars' || resolvedFrameType === 'lancer-bar') {
    return resolvedFrameType;
  }

  throw new Error(`Unknown text crawl frame type "${resolvedFrameType}". Expected "none", "cinematic-bars", or "lancer-bar".`);
};

const normalizeConfig = (config: TextCrawlConfig): NormalizedConfig => {
  const frameType = resolveTextCrawlFrameType(config.frame?.type);

  return {
    offsetX: config.offsetX ?? '0',
    offsetY: config.offsetY ?? '0',
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
