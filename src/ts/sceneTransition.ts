import type { TextCrawlConfig } from './textCrawl';
import type { ModuleSocket } from './types';
import { createTextCrawlHtml } from './textCrawl';

export type SceneTransitionConfig = {
  sceneId: string;
  id?: string;
  text?: TextCrawlConfig;
  timing?: SceneTransitionTiming;
  sounds?: SceneTransitionSounds;
  aboveUi?: boolean;
  blockInteractions?: boolean;
};

export type SceneTransitionTiming = {
  closeMs?: number;
  textMs?: number;
  openMs?: number;
  textFadeMs?: number;
  sceneReadyTimeoutMs?: number;
};

export type SceneTransitionSounds = {
  close?: string;
  open?: string;
  typing?: string;
  doorVolume?: number;
  typingVolume?: number;
};

type NormalizedSceneTransitionConfig = Required<Omit<SceneTransitionConfig, 'text' | 'timing' | 'sounds'>> & {
  text?: TextCrawlConfig;
  timing: Required<SceneTransitionTiming>;
  sounds: Required<SceneTransitionSounds>;
};

type TransitionSound = {
  stop: () => Promise<unknown> | unknown;
};

export const playSceneTransition = (socket: ModuleSocket) => (config: SceneTransitionConfig) => {
  assertGM('play scene transitions');
  if (!config.sceneId) {
    throw new Error('Scene id is required.');
  }
  if (!(game as ReadyGame).scenes?.has(config.sceneId)) {
    throw new Error(`Unable to find scene with id "${config.sceneId}".`);
  }

  return socket.executeForEveryone('playSceneTransition', config, (game as ReadyGame).user.id);
};

export const setupSceneTransitionSocket = (socket: ModuleSocket) => {
  socket.register('playSceneTransition', handleSceneTransition);
};

const handleSceneTransition = async (config: SceneTransitionConfig, controllingUserId: string) => {
  const normalizedConfig = normalizeConfig(config);
  const overlay = createTransitionOverlay(normalizedConfig);
  let typingSound: TransitionSound | undefined;

  removeExistingTransition(normalizedConfig.id);
  document.body.append(overlay);

  try {
    await prepareOverlayForAnimation(overlay);
    void playSound(normalizedConfig.sounds.close, normalizedConfig.sounds.doorVolume);
    overlay.classList.add('doors-closing');
    overlay.classList.add('doors-closed');
    overlay.classList.remove('doors-open');

    await sleeper(normalizedConfig.timing.closeMs);
    overlay.classList.remove('doors-closing');
    overlay.classList.add('doors-sealed');

    if (normalizedConfig.text) {
      const textHtml = await createTextCrawlHtml(normalizedConfig.text);
      const textContainer = overlay.querySelector<HTMLElement>('.anarchist-scene-transition__text');
      if (textContainer) {
        textContainer.innerHTML = textHtml;
        overlay.classList.add('text-visible');
      }

      if (normalizedConfig.sounds.typing) {
        typingSound = await playSound(
          normalizedConfig.sounds.typing,
          normalizedConfig.sounds.typingVolume,
          true
        );
      }
    }

    const sceneReady = waitForSceneReady(normalizedConfig.sceneId, normalizedConfig.timing.sceneReadyTimeoutMs);
    if ((game as ReadyGame).user.id === controllingUserId) {
      await activateScene(normalizedConfig.sceneId);
    }

    await Promise.all([sceneReady, sleeper(normalizedConfig.timing.textMs)]);
    await stopSound(typingSound);

    void playSound(normalizedConfig.sounds.open, normalizedConfig.sounds.doorVolume);
    overlay.classList.add('doors-opening');
    overlay.classList.add('doors-open');
    overlay.classList.remove('doors-sealed');
    overlay.classList.remove('doors-closed');

    await sleeper(normalizedConfig.timing.openMs);

    overlay.classList.add('text-hidden');
    await sleeper(normalizedConfig.timing.textFadeMs);
  } finally {
    await stopSound(typingSound);
    overlay.remove();
  }
};

const activateScene = async (sceneId: string) => {
  const scene = (game as ReadyGame).scenes?.get(sceneId);
  if (!scene) {
    throw new Error(`Unable to find scene with id "${sceneId}".`);
  }

  if (canvas.scene?.id !== sceneId) {
    await scene.activate();
  }
};

const waitForSceneReady = (sceneId: string, timeoutMs: number) => {
  if (canvas.scene?.id === sceneId) {
    return Promise.resolve();
  }

  return new Promise<void>(resolve => {
    const timeoutId = window.setTimeout(() => {
      Hooks.off('canvasReady', hookId);
      resolve();
    }, timeoutMs);

    const hookId = Hooks.on('canvasReady', () => {
      if (canvas.scene?.id !== sceneId) {
        return;
      }

      window.clearTimeout(timeoutId);
      Hooks.off('canvasReady', hookId);
      resolve();
    });
  });
};

const createTransitionOverlay = (config: NormalizedSceneTransitionConfig) => {
  const overlay = document.createElement('div');
  overlay.className = [
    'anarchist-overlay',
    'anarchist-scene-transition',
    'doors-open',
    config.aboveUi ? 'above-ui' : '',
    config.blockInteractions ? 'block-interactions' : ''
  ].filter(Boolean).join(' ');
  overlay.dataset.anarchistOverlay = 'true';
  overlay.dataset.anarchistOverlayId = config.id;
  overlay.style.setProperty('--door-close-duration', `${config.timing.closeMs}ms`);
  overlay.style.setProperty('--door-open-duration', `${config.timing.openMs}ms`);
  overlay.style.setProperty('--text-fade-duration', `${config.timing.textFadeMs}ms`);
  overlay.innerHTML = `
    <div class="anarchist-scene-transition__door anarchist-scene-transition__door--left">
      <div class="anarchist-scene-transition__door-rib"></div>
      <div class="anarchist-scene-transition__door-rib"></div>
      <div class="anarchist-scene-transition__door-rib"></div>
      <div class="anarchist-scene-transition__hazard"></div>
    </div>
    <div class="anarchist-scene-transition__door anarchist-scene-transition__door--right">
      <div class="anarchist-scene-transition__door-rib"></div>
      <div class="anarchist-scene-transition__door-rib"></div>
      <div class="anarchist-scene-transition__door-rib"></div>
      <div class="anarchist-scene-transition__hazard"></div>
    </div>
    <div class="anarchist-scene-transition__seam" aria-hidden="true"></div>
    <div class="anarchist-scene-transition__text"></div>
  `;

  return overlay;
};

const normalizeConfig = (config: SceneTransitionConfig): NormalizedSceneTransitionConfig => {
  return {
    sceneId: config.sceneId,
    id: config.id ?? 'scene-transition',
    text: config.text,
    timing: {
      closeMs: config.timing?.closeMs ?? 2200,
      textMs: config.timing?.textMs ?? calculateTextDuration(config.text),
      openMs: config.timing?.openMs ?? 2400,
      textFadeMs: config.timing?.textFadeMs ?? 900,
      sceneReadyTimeoutMs: config.timing?.sceneReadyTimeoutMs ?? 10000
    },
    sounds: {
      close: config.sounds?.close ?? '',
      open: config.sounds?.open ?? '',
      typing: config.sounds?.typing ?? '',
      doorVolume: config.sounds?.doorVolume ?? 0.8,
      typingVolume: config.sounds?.typingVolume ?? 0.35
    },
    aboveUi: config.aboveUi ?? true,
    blockInteractions: config.blockInteractions ?? true
  };
};

const calculateTextDuration = (text?: TextCrawlConfig) => {
  if (!text?.lines.length) {
    return 1500;
  }

  const typingTime = text.typingTime ?? 2;
  const delay = text.delay ?? 1;
  const totalSeconds = ((text.lines.length - 1) * (typingTime + delay)) + typingTime + 1;
  return totalSeconds * 1000;
};

const removeExistingTransition = (id: string) => {
  Array.from(document.querySelectorAll<HTMLElement>('.anarchist-scene-transition'))
    .filter(overlay => overlay.dataset.anarchistOverlayId === id)
    .forEach(overlay => overlay.remove());
};

const playSound = async (src: string, volume: number, loop = false) => {
  if (!src) {
    return undefined;
  }

  try {
    const sound = (game as ReadyGame).audio.create({ src });
    sound.volume = volume;
    await sound.play({ loop });
    return sound;
  } catch (error) {
    console.warn(`Anarchist Overlay | Unable to play sound "${src}".`, error);
    return undefined;
  }
};

const stopSound = async (sound?: TransitionSound) => {
  if (!sound) {
    return;
  }

  try {
    await sound.stop();
  } catch (error) {
    console.warn('Anarchist Overlay | Unable to stop transition sound.', error);
  }
};

const sleeper = (time: number) => new Promise(resolve => window.setTimeout(resolve, time));

const prepareOverlayForAnimation = async (overlay: HTMLElement) => {
  await nextFrame();
  void overlay.offsetWidth;
  await nextFrame();
};

const nextFrame = () => new Promise(resolve => window.requestAnimationFrame(resolve));

const assertGM = (action: string) => {
  if (!(game as ReadyGame).user.isGM) {
    throw new Error(`Only GM users can ${action}.`);
  }
};
