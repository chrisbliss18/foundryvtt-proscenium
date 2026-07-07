import { isTextCrawlTypewriterEffect, type TextCrawlConfig } from './textCrawl';
import type {
  AudioCancellationController,
  AudioHelperGlobal,
  GameAudioGlobal,
  SceneTransitionSounds,
  TransitionAudio,
  TransitionAudioController,
  TransitionSound
} from './sceneTransitionTypes';

export const createTransitionAudioController = (): TransitionAudioController => {
  const activeSounds = new Set<TransitionSound>();

  return {
    play: (src: string, volume: number) => {
      void playTrackedSound(src, volume, activeSounds);
    },
    startTyping: (text: TextCrawlConfig, sounds: Required<SceneTransitionSounds>, controller: AudioCancellationController) => {
      if (!sounds.typingClick || !isTextCrawlTypewriterEffect(text)) {
        return undefined;
      }

      return scheduleTypingClicks(text, sounds.typingClick, sounds.typingVolume, controller, activeSounds);
    },
    stopAll: async () => {
      await Promise.allSettled(
        Array.from(activeSounds, sound => stopSound(sound))
      );
      activeSounds.clear();
    }
  };
};

const playTrackedSound = async (
  src: string,
  volume: number,
  activeSounds: Set<TransitionSound>
) => {
  const sound = await playSound(src, volume);
  if (!sound) {
    return undefined;
  }

  activeSounds.add(sound);
  void stopWhenComplete(sound).finally(() => activeSounds.delete(sound));
  return sound;
};

const playSound = async (src: string, volume: number): Promise<TransitionSound | undefined> => {
  if (!src) {
    return undefined;
  }

  try {
    const audioHelper = getAudioHelper();
    if (audioHelper?.play) {
      return await audioHelper.play({ src, volume, loop: false }, false);
    }

    const gameAudio = (game as ReadyGame & { audio?: GameAudioGlobal }).audio;
    if (gameAudio?.play) {
      return await gameAudio.play(src, { volume, loop: false });
    }
    if (gameAudio?.create) {
      const fallbackSound = gameAudio.create({ src });
      fallbackSound.volume = volume;
      await fallbackSound.load?.();
      await fallbackSound.play?.({ loop: false });
      return fallbackSound;
    }

    return await playNativeAudio(src, volume);
  } catch (error) {
    console.warn(`Proscenium | Unable to play sound "${src}".`, error);
    return undefined;
  }
};

const getAudioHelper = () => {
  const globals = globalThis as typeof globalThis & {
    AudioHelper?: AudioHelperGlobal;
    foundry?: {
      audio?: {
        AudioHelper?: AudioHelperGlobal;
      };
    };
  };

  return globals.AudioHelper ?? globals.foundry?.audio?.AudioHelper;
};

const playNativeAudio = async (src: string, volume: number): Promise<TransitionSound> => {
  const audio = new Audio(src);
  audio.volume = volume;
  await audio.play();

  return {
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
    }
  };
};

const scheduleTypingClicks = (
  text: TextCrawlConfig,
  src: string,
  volume: number,
  controller: AudioCancellationController,
  activeSounds: Set<TransitionSound>
): TransitionAudio => {
  const timers: number[] = [];
  const typingTimeMs = (text.typingTime ?? 2) * 1000;
  const delayMs = (text.delay ?? 1) * 1000;
  const lineDelayMs = typingTimeMs + delayMs;

  text.lines.forEach((line, lineIndex) => {
    if (!line.text.length) {
      return;
    }

    const intervalMs = typingTimeMs / line.text.length;
    const startMs = lineIndex * lineDelayMs;
    for (let index = 0; index < line.text.length; index++) {
      if (line.text.charAt(index).trim() === '') {
        continue;
      }

      timers.push(window.setTimeout(() => {
        if (!controller.canceled) {
          void playTrackedSound(src, volume, activeSounds);
        }
      }, startMs + ((index + 1) * intervalMs)));
    }
  });

  return {
    stop: () => timers.forEach(timer => window.clearTimeout(timer))
  };
};

const stopSound = async (sound?: TransitionSound) => {
  if (!sound) {
    return;
  }

  try {
    await sound.stop();
  } catch (error) {
    console.warn('Proscenium | Unable to stop transition sound.', error);
  }
};

const stopWhenComplete = async (sound: TransitionSound) => {
  const maybeSound = sound as TransitionSound & {
    playing?: boolean;
    duration?: number;
  };

  const duration = maybeSound.duration;
  if (!duration) {
    return;
  }

  await new Promise(resolve => window.setTimeout(resolve, (duration * 1000) + 250));
  if (maybeSound.playing) {
    await stopSound(sound);
  }
};
