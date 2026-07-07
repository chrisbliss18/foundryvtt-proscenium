import type { TextCrawlConfig } from './textCrawl';
import type { ModuleSocket } from './types';
import type {
  NormalizedSceneTransitionConfig,
  SceneTransitionConfig,
  SceneTransitionSounds,
  SceneTransitionSocketConfig,
  SceneTransitionTiming,
  SceneTransitionType,
  TransitionAudio,
  TransitionAudioController,
  TransitionController
} from './sceneTransitionTypes';
import { createTextCrawlHtml, resolveTextCrawlFrameType } from './textCrawl';
import { moduleId } from './constants';
import { createTransitionAudioController } from './sceneTransitionAudio';
import {
  createTransitionOverlay,
  getDoorElement,
  getFadeElement,
  getTextElement,
  prepareOverlayForAnimation,
  removeExistingTransition,
  waitForDelay,
  waitForTransition
} from './sceneTransitionDom';

export type {
  SceneTransitionConfig,
  SceneTransitionSounds,
  SceneTransitionTiming,
  SceneTransitionType
} from './sceneTransitionTypes';

const activeTransitions = new Map<string, TransitionController>();

type SceneNameLookupDocument = {
  id: string | null;
  name: string;
};

const defaultTiming: Required<SceneTransitionTiming> = {
  doorCloseMs: 2200,
  briefingMs: 0,
  doorUnlockMs: 700,
  doorOpenMs: 2400,
  fadeOutMs: 1200,
  fadeInMs: 1200,
  textFadeMs: 900,
  sceneReadyTimeoutMs: 10000
};

const defaultSounds: Required<SceneTransitionSounds> = {
  doorClose: `modules/${moduleId}/sounds/industrial-door-close.ogg`,
  doorSeal: `modules/${moduleId}/sounds/industrial-door-seal.ogg`,
  doorUnlock: `modules/${moduleId}/sounds/industrial-door-unlock.ogg`,
  doorOpen: `modules/${moduleId}/sounds/industrial-door-open.ogg`,
  typingClick: `modules/${moduleId}/sounds/mechanical-typing-click.ogg`,
  doorVolume: 0.8,
  typingVolume: 0.35
};

export const playSceneTransition = (socket: ModuleSocket) => async (config: SceneTransitionConfig) => {
  try {
    assertGM('play scene transitions');
    resolveSceneTransitionType(config.transition?.type);
    if (config.text?.frame?.type) {
      resolveTextCrawlFrameType(config.text.frame.type);
    }
    const sceneId = resolveSceneIdByName(config.sceneName);

    return await socket.executeForEveryone(
      'playSceneTransition',
      { ...config, sceneId },
      (game as ReadyGame).user.id
    );
  } catch (error) {
    notifyError(error);
    throw error;
  }
};

export const setupSceneTransitionSocket = (socket: ModuleSocket) => {
  socket.register('playSceneTransition', handleSceneTransition);
};

const handleSceneTransition = async (config: SceneTransitionSocketConfig, controllingUserId: string) => {
  const normalizedConfig = normalizeConfig(config);
  const overlay = createTransitionOverlay(normalizedConfig);
  const controller = createTransitionController();
  const audio = createTransitionAudioController();
  let typingAudio: TransitionAudio | undefined;
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || controller.canceled) {
      return;
    }

    event.preventDefault();
    controller.cancel();
  };

  activeTransitions.get(normalizedConfig.id)?.cancel();
  removeExistingTransition(normalizedConfig.id);
  activeTransitions.set(normalizedConfig.id, controller);
  window.addEventListener('keydown', handleKeyDown, true);
  document.body.append(overlay);

  try {
    await prepareOverlayForAnimation(overlay);

    const result = normalizedConfig.transition.type === 'fade'
      ? await runFadeTransition(overlay, normalizedConfig, controllingUserId, controller, audio)
      : await runIndustrialDoorTransition(overlay, normalizedConfig, controllingUserId, controller, audio);
    typingAudio = result.typingAudio;
    if (result.canceled) {
      return await finishLocalCancel(normalizedConfig, controllingUserId, overlay, audio, typingAudio);
    }
  } finally {
    window.removeEventListener('keydown', handleKeyDown, true);
    if (activeTransitions.get(normalizedConfig.id) === controller) {
      activeTransitions.delete(normalizedConfig.id);
    }
    await typingAudio?.stop();
    await audio.stopAll();
    overlay.remove();
  }
};

type SceneTransitionRunResult = {
  canceled: boolean;
  typingAudio?: TransitionAudio;
};

const runIndustrialDoorTransition = async (
  overlay: HTMLElement,
  config: NormalizedSceneTransitionConfig,
  controllingUserId: string,
  controller: TransitionController,
  audio: TransitionAudioController
): Promise<SceneTransitionRunResult> => {
  let typingAudio: TransitionAudio | undefined;

  if (await closeDoors(overlay, config, controller, audio)) {
    return { canceled: true, typingAudio };
  }

  if (config.text) {
    typingAudio = await renderBriefingText(overlay, config, controller, audio);
  }

  if (await activateTargetScene(config, controllingUserId, controller)) {
    return { canceled: true, typingAudio };
  }

  await typingAudio?.stop();
  typingAudio = undefined;

  if (await openDoors(overlay, config, controller, audio)) {
    return { canceled: true, typingAudio };
  }

  overlay.classList.add('text-hidden');
  if (await waitForTransition(getTextElement(overlay), 'opacity', config.timing.textFadeMs, controller)) {
    return { canceled: true, typingAudio };
  }

  return { canceled: false, typingAudio };
};

const runFadeTransition = async (
  overlay: HTMLElement,
  config: NormalizedSceneTransitionConfig,
  controllingUserId: string,
  controller: TransitionController,
  audio: TransitionAudioController
): Promise<SceneTransitionRunResult> => {
  let typingAudio: TransitionAudio | undefined;

  if (await fadeToBlack(overlay, config, controller)) {
    return { canceled: true, typingAudio };
  }

  if (config.text) {
    typingAudio = await renderBriefingText(overlay, config, controller, audio);
  }

  if (await activateTargetScene(config, controllingUserId, controller)) {
    return { canceled: true, typingAudio };
  }

  await typingAudio?.stop();
  typingAudio = undefined;

  if (config.text) {
    overlay.classList.add('text-hidden');
    if (await waitForTransition(getTextElement(overlay), 'opacity', config.timing.textFadeMs, controller)) {
      return { canceled: true, typingAudio };
    }
  }

  if (await fadeFromBlack(overlay, config, controller)) {
    return { canceled: true, typingAudio };
  }

  return { canceled: false, typingAudio };
};

const closeDoors = async (
  overlay: HTMLElement,
  config: NormalizedSceneTransitionConfig,
  controller: TransitionController,
  audio: TransitionAudioController
) => {
  audio.play(config.sounds.doorClose, config.sounds.doorVolume);
  overlay.classList.add('doors-closing');
  overlay.classList.add('doors-closed');
  overlay.classList.remove('doors-open');

  if (await waitForTransition(getDoorElement(overlay), 'transform', config.timing.doorCloseMs, controller)) {
    return true;
  }

  overlay.classList.remove('doors-closing');
  overlay.classList.add('doors-sealed');
  audio.play(config.sounds.doorSeal, config.sounds.doorVolume);
  return false;
};

const fadeToBlack = async (
  overlay: HTMLElement,
  config: NormalizedSceneTransitionConfig,
  controller: TransitionController
) => {
  overlay.classList.add('fade-covering');
  overlay.classList.add('fade-black');

  return waitForTransition(getFadeElement(overlay), 'opacity', config.timing.fadeOutMs, controller);
};

const fadeFromBlack = async (
  overlay: HTMLElement,
  config: NormalizedSceneTransitionConfig,
  controller: TransitionController
) => {
  overlay.classList.remove('fade-covering');
  overlay.classList.add('fade-revealing');
  overlay.classList.remove('fade-black');

  return waitForTransition(getFadeElement(overlay), 'opacity', config.timing.fadeInMs, controller);
};

const renderBriefingText = async (
  overlay: HTMLElement,
  config: NormalizedSceneTransitionConfig,
  controller: TransitionController,
  audio: TransitionAudioController
) => {
  if (!config.text) {
    return undefined;
  }

  const textHtml = await createTextCrawlHtml(config.text);
  const textContainer = getTextElement(overlay);
  if (textContainer) {
    textContainer.innerHTML = textHtml;
    overlay.classList.add('text-visible');
  }

  return audio.startTyping(config.text, config.sounds, controller);
};

const activateTargetScene = async (
  config: NormalizedSceneTransitionConfig,
  controllingUserId: string,
  controller: TransitionController
) => {
  const sceneReady = waitForSceneReady(config.sceneId, config.timing.sceneReadyTimeoutMs);
  const activation = (game as ReadyGame).user.id === controllingUserId
    ? activateScene(config.sceneId)
    : Promise.resolve();

  return waitForTaskOrCancel(
    Promise.all([activation, sceneReady, waitForBriefing(config, controller)]),
    controller
  );
};

const waitForBriefing = (config: NormalizedSceneTransitionConfig, controller: TransitionController) => {
  return waitForDelay(config.timing.briefingMs, controller);
};

const openDoors = async (
  overlay: HTMLElement,
  config: NormalizedSceneTransitionConfig,
  controller: TransitionController,
  audio: TransitionAudioController
) => {
  audio.play(config.sounds.doorUnlock, config.sounds.doorVolume);
  if (await waitForDelay(config.timing.doorUnlockMs, controller)) {
    return true;
  }

  audio.play(config.sounds.doorOpen, config.sounds.doorVolume);
  overlay.classList.add('doors-opening');
  overlay.classList.add('doors-open');
  overlay.classList.remove('doors-sealed');
  overlay.classList.remove('doors-closed');

  return waitForTransition(getDoorElement(overlay), 'transform', config.timing.doorOpenMs, controller);
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

const viewScene = async (sceneId: string) => {
  const scene = (game as ReadyGame).scenes?.get(sceneId);
  if (!scene || canvas.scene?.id === sceneId) {
    return;
  }

  try {
    await scene.view();
  } catch (error) {
    console.warn(`Anarchist Overlay | Unable to view scene "${sceneId}" after local cancel.`, error);
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

const normalizeConfig = (config: SceneTransitionSocketConfig): NormalizedSceneTransitionConfig => {
  const transitionType = resolveSceneTransitionType(config.transition?.type);
  const timing = {
    ...defaultTiming,
    ...config.timing,
    briefingMs: config.timing?.briefingMs ?? calculateTextDuration(config.text)
  };

  return {
    sceneId: config.sceneId,
    sceneName: config.sceneName,
    id: config.id ?? 'scene-transition',
    transition: {
      type: transitionType
    },
    text: config.text,
    timing,
    sounds: {
      ...defaultSounds,
      ...config.sounds
    },
    aboveUi: config.aboveUi ?? true,
    blockInteractions: config.blockInteractions ?? true
  };
};

const resolveSceneIdByName = (name: string) => {
  const sceneName = name?.trim();
  if (!sceneName) {
    throw new Error('Scene name is required.');
  }

  const scenes = (game as ReadyGame).scenes;
  if (!scenes) {
    throw new Error('Unable to resolve scene name: scene collection is not available.');
  }

  const matches = (scenes.contents as SceneNameLookupDocument[]).filter(scene => scene.name === sceneName);
  if (matches.length === 0) {
    throw new Error(`Unable to find scene named "${sceneName}".`);
  }
  if (matches.length > 1) {
    throw new Error(`Scene name "${sceneName}" matches ${matches.length} scenes. Rename duplicate scenes or use a unique scene name.`);
  }

  const sceneId = matches[0].id;
  if (!sceneId) {
    throw new Error(`Unable to resolve an id for scene "${sceneName}".`);
  }

  return sceneId;
};

const resolveSceneTransitionType = (transitionType?: string): SceneTransitionType => {
  const resolvedTransitionType = transitionType ?? 'industrial-doors';
  if (resolvedTransitionType === 'industrial-doors' || resolvedTransitionType === 'fade') {
    return resolvedTransitionType;
  }

  throw new Error(`Unknown scene transition type "${resolvedTransitionType}". Expected "industrial-doors" or "fade".`);
};

const notifyError = (error: unknown) => {
  const message = error instanceof Error
    ? error.message
    : 'Unable to play scene transition.';
  ui.notifications?.error(`Anarchist Overlay | ${message}`);
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

const finishLocalCancel = async (
  config: NormalizedSceneTransitionConfig,
  controllingUserId: string,
  overlay: HTMLElement,
  audio: TransitionAudioController,
  typingAudio?: TransitionAudio
) => {
  await typingAudio?.stop();
  await audio.stopAll();
  overlay.remove();

  if ((game as ReadyGame).user.id === controllingUserId) {
    void activateScene(config.sceneId);
  } else {
    void viewScene(config.sceneId);
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

const waitForTaskOrCancel = async (task: Promise<unknown>, controller: TransitionController) => {
  await Promise.race([task, controller.cancelPromise]);
  return controller.canceled;
};

const assertGM = (action: string) => {
  if (!(game as ReadyGame).user.isGM) {
    throw new Error(`Only GM users can ${action}.`);
  }
};
