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
  unlockMs?: number;
  openMs?: number;
  textFadeMs?: number;
  sceneReadyTimeoutMs?: number;
};

export type SceneTransitionSounds = {
  close?: string;
  seal?: string;
  unlock?: string;
  open?: string;
  typing?: string;
  typingClick?: string;
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

type TransitionAudio = {
  stop: () => Promise<unknown> | unknown;
};

type TransitionController = {
  canceled: boolean;
  cancel: () => void;
  cancelPromise: Promise<void>;
};

type AudioHelperGlobal = {
  play: (
    data: { src: string; volume: number; loop: boolean },
    socketOptions?: boolean | null
  ) => Promise<TransitionSound>;
};

const activeTransitions = new Map<string, TransitionController>();
let sceneTransitionSocket: ModuleSocket | undefined;

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
  sceneTransitionSocket = socket;
  socket.register('playSceneTransition', handleSceneTransition);
  socket.register('cancelSceneTransition', handleSceneTransitionCancel);
};

const handleSceneTransitionCancel = (id: string) => {
  activeTransitions.get(id)?.cancel();
};

const handleSceneTransition = async (config: SceneTransitionConfig, controllingUserId: string) => {
  const normalizedConfig = normalizeConfig(config);
  const overlay = createTransitionOverlay(normalizedConfig);
  const controller = createTransitionController();
  let typingAudio: TransitionAudio | undefined;
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || controller.canceled) {
      return;
    }

    event.preventDefault();
    controller.cancel();
    void requestTransitionCancel(normalizedConfig.id);
  };

  activeTransitions.get(normalizedConfig.id)?.cancel();
  removeExistingTransition(normalizedConfig.id);
  activeTransitions.set(normalizedConfig.id, controller);
  window.addEventListener('keydown', handleKeyDown, true);
  document.body.append(overlay);

  try {
    await prepareOverlayForAnimation(overlay);
    void playSound(normalizedConfig.sounds.close, normalizedConfig.sounds.doorVolume);
    overlay.classList.add('doors-closing');
    overlay.classList.add('doors-closed');
    overlay.classList.remove('doors-open');

    if (await waitForOrCancel(sleeper(normalizedConfig.timing.closeMs), controller)) {
      return await finishCanceledTransition(normalizedConfig, controllingUserId, overlay, typingAudio);
    }

    overlay.classList.remove('doors-closing');
    overlay.classList.add('doors-sealed');
    void playSound(normalizedConfig.sounds.seal, normalizedConfig.sounds.doorVolume);

    if (normalizedConfig.text) {
      const textHtml = await createTextCrawlHtml(normalizedConfig.text);
      const textContainer = overlay.querySelector<HTMLElement>('.anarchist-scene-transition__text');
      if (textContainer) {
        textContainer.innerHTML = textHtml;
        overlay.classList.add('text-visible');
      }

      typingAudio = await startTypingAudio(normalizedConfig.text, normalizedConfig.sounds, controller);
    }

    const sceneReady = waitForSceneReady(normalizedConfig.sceneId, normalizedConfig.timing.sceneReadyTimeoutMs);
    if ((game as ReadyGame).user.id === controllingUserId) {
      await activateScene(normalizedConfig.sceneId);
    }

    if (await waitForOrCancel(Promise.all([sceneReady, sleeper(normalizedConfig.timing.textMs)]), controller)) {
      return await finishCanceledTransition(normalizedConfig, controllingUserId, overlay, typingAudio);
    }

    await typingAudio?.stop();
    typingAudio = undefined;

    void playSound(normalizedConfig.sounds.unlock, normalizedConfig.sounds.doorVolume);

    if (await waitForOrCancel(sleeper(normalizedConfig.timing.unlockMs), controller)) {
      return await finishCanceledTransition(normalizedConfig, controllingUserId, overlay, typingAudio);
    }

    void playSound(normalizedConfig.sounds.open, normalizedConfig.sounds.doorVolume);
    overlay.classList.add('doors-opening');
    overlay.classList.add('doors-open');
    overlay.classList.remove('doors-sealed');
    overlay.classList.remove('doors-closed');

    if (await waitForOrCancel(sleeper(normalizedConfig.timing.openMs), controller)) {
      return await finishCanceledTransition(normalizedConfig, controllingUserId, overlay, typingAudio);
    }

    overlay.classList.add('text-hidden');

    if (await waitForOrCancel(sleeper(normalizedConfig.timing.textFadeMs), controller)) {
      return await finishCanceledTransition(normalizedConfig, controllingUserId, overlay, typingAudio);
    }
  } finally {
    window.removeEventListener('keydown', handleKeyDown, true);
    if (activeTransitions.get(normalizedConfig.id) === controller) {
      activeTransitions.delete(normalizedConfig.id);
    }
    await typingAudio?.stop();
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
      unlockMs: config.timing?.unlockMs ?? 700,
      openMs: config.timing?.openMs ?? 2400,
      textFadeMs: config.timing?.textFadeMs ?? 900,
      sceneReadyTimeoutMs: config.timing?.sceneReadyTimeoutMs ?? 10000
    },
    sounds: {
      close: config.sounds?.close ?? '',
      seal: config.sounds?.seal ?? '',
      unlock: config.sounds?.unlock ?? '',
      open: config.sounds?.open ?? '',
      typing: config.sounds?.typing ?? '',
      typingClick: config.sounds?.typingClick ?? '',
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

const startTypingAudio = async (
  text: TextCrawlConfig,
  sounds: Required<SceneTransitionSounds>,
  controller: TransitionController
): Promise<TransitionAudio | undefined> => {
  if (sounds.typingClick) {
    return scheduleTypingClicks(text, sounds.typingClick, sounds.typingVolume, controller);
  }

  if (sounds.typing) {
    const sound = await playSound(sounds.typing, sounds.typingVolume, true);
    return { stop: () => stopSound(sound) };
  }

  return undefined;
};

const scheduleTypingClicks = (
  text: TextCrawlConfig,
  src: string,
  volume: number,
  controller: TransitionController
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
          void playSound(src, volume);
        }
      }, startMs + ((index + 1) * intervalMs)));
    }
  });

  return {
    stop: () => timers.forEach(timer => window.clearTimeout(timer))
  };
};

const playSound = async (src: string, volume: number, loop = false) => {
  if (!src) {
    return undefined;
  }

  try {
    const audioHelper = (globalThis as typeof globalThis & { AudioHelper?: AudioHelperGlobal }).AudioHelper;
    if (audioHelper) {
      return await audioHelper.play({ src, volume, loop }, false);
    }

    const fallbackSound = (game as ReadyGame).audio.create({ src });
    fallbackSound.volume = volume;
    await fallbackSound.load();
    await fallbackSound.play({ loop });
    return fallbackSound;
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

const finishCanceledTransition = async (
  config: NormalizedSceneTransitionConfig,
  controllingUserId: string,
  overlay: HTMLElement,
  typingAudio?: TransitionAudio
) => {
  await typingAudio?.stop();
  overlay.classList.add('text-hidden');
  const sceneReady = waitForSceneReady(config.sceneId, config.timing.sceneReadyTimeoutMs);
  if ((game as ReadyGame).user.id === controllingUserId) {
    await activateScene(config.sceneId);
  }
  await sceneReady;
  overlay.remove();
};

const requestTransitionCancel = async (id: string) => {
  try {
    await sceneTransitionSocket?.executeForEveryone('cancelSceneTransition', id);
  } catch (error) {
    console.warn(`Anarchist Overlay | Unable to broadcast cancellation for transition "${id}".`, error);
  }
};

const createTransitionController = (): TransitionController => {
  let resolveCancel: () => void;
  const cancelPromise = new Promise<void>(resolve => {
    resolveCancel = resolve;
  });

  return {
    canceled: false,
    cancel: function cancel(): void {
      if (this.canceled) {
        return;
      }
      this.canceled = true;
      resolveCancel();
    },
    cancelPromise
  };
};

const waitForOrCancel = async (task: Promise<unknown>, controller: TransitionController) => {
  await Promise.race([task, controller.cancelPromise]);
  return controller.canceled;
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
