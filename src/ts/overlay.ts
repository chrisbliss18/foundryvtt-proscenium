import type { ModuleSocket } from './types';
import {moduleId} from "./constants";
import { createTransitionAudioController } from './sceneTransitionAudio';
import {
  resolveSceneTransitionSoundProfileType,
  sceneTransitionSoundProfileDefaults
} from './sceneTransitionSoundProfiles';
import type {
  SceneTransitionSoundProfileType,
  SceneTransitionSounds,
  TransitionAudio,
  TransitionAudioController
} from './sceneTransitionTypes';
import {
  createTextCrawlHtml,
  getTextCrawlThemeType,
  isTextCrawlTypewriterEffect,
  type TextCrawlConfig
} from './textCrawl';
import type { PresentationThemeType } from './theme';

export type OverlayConfig = {
  id?: string;
  positionX?: string;
  positionY?: string;
  fadeOnClose?: boolean;
  closeTime?: number;
  closeAllWindows?: boolean;
  clearExisting?: boolean;
  aboveUi?: boolean;
  blockInteractions?: boolean;
}

export type TextOverlayAudioConfig = {
  profile?: SceneTransitionSoundProfileType;
  volume?: {
    typing?: number;
  };
  overrides?: {
    typing?: string;
  };
};

type NormalizedOverlayConfig = Required<Omit<OverlayConfig, 'id'>> & Pick<OverlayConfig, 'id'>;

type RuntimeTextOverlayAudioConfig = {
  text: TextCrawlConfig;
  sounds: Required<SceneTransitionSounds>;
};

type OverlayAudioState = {
  controller: {
    canceled: boolean;
  };
  audio: TransitionAudioController;
  typingAudio?: TransitionAudio;
};

const activeOverlayAudio = new Map<HTMLElement, OverlayAudioState>();

export const createOverlay = (socket: ModuleSocket) => (config: OverlayConfig, html: string) => {
  assertGM('create overlays');
  return socket.executeForEveryone('createOverlay', config, html);
}

export const createTextOverlay = (socket: ModuleSocket) => (
  config: OverlayConfig,
  text: TextCrawlConfig,
  audio?: TextOverlayAudioConfig
) => {
  assertGM('create text overlays');
  return socket.executeForEveryone('createTextOverlay', config, text, audio);
}

export const closeOverlay = (socket: ModuleSocket) => (id: string) => {
  assertGM('close overlays');
  if(!id) {
    throw new Error('Overlay id is required.');
  }
  return socket.executeForEveryone('closeOverlay', id);
}

export const closeAllOverlays = (socket: ModuleSocket) => () => {
  assertGM('close overlays');
  return socket.executeForEveryone('closeAllOverlays');
}

export const setupOverlaySocket = (socket: ModuleSocket) => {
  socket.register('createOverlay', handleOverlayCreation);
  socket.register('createTextOverlay', handleTextOverlayCreation);
  socket.register('closeOverlay', handleOverlayClose);
  socket.register('closeAllOverlays', handleAllOverlayClose);
}



const handleTextOverlayCreation = async (
  config: OverlayConfig,
  text: TextCrawlConfig,
  audio?: TextOverlayAudioConfig
) => {
  const html = await createTextCrawlHtml(text);
  return handleOverlayCreation(config, html, resolveTextOverlayAudio(text, audio));
};

const handleOverlayCreation = async (
  config: OverlayConfig,
  html: string,
  audio?: RuntimeTextOverlayAudioConfig
) => {
  const normalizedConfig = normalizeConfig(config);
  if(normalizedConfig.clearExisting) {
    await removeAllOverlays();
  }

  const template = await renderTemplate(`modules/${moduleId}/templates/overlay.hbs`, normalizedConfig);
  const wrapper = document.createElement('template');
  wrapper.innerHTML = template.trim();
  const overlay = wrapper.content.firstElementChild;
  if (!(overlay instanceof HTMLElement)) {
    throw new Error('Unable to render overlay template.');
  }

  overlay.dataset.prosceniumOverlay = 'true';
  if(normalizedConfig.id) {
    overlay.dataset.prosceniumOverlayId = normalizedConfig.id;
  }

  overlay.innerHTML = html;
  document.body.append(overlay);
  startOverlayAudio(overlay, audio);

  if(normalizedConfig.closeAllWindows) {
    await closeAllWindows();
  }

  if(normalizedConfig.closeTime > 0) {
    await handleClosingOverlay(overlay, normalizedConfig);
  }

  return overlay;
};

const handleOverlayClose = async (id: string) => {
  const overlay = getOverlayById(id);
  if (overlay) {
    await removeOverlay(overlay);
  }
}

const handleAllOverlayClose = async () => {
  await removeAllOverlays();
}

const handleClosingOverlay = async (overlay: HTMLElement, config: NormalizedOverlayConfig) => {
  await sleeper(config.closeTime * 1000);
  if(config.fadeOnClose) {
    overlay.classList.add('fade-out');
    await sleeper(2000);
  }
  await removeOverlay(overlay);
};

const normalizeConfig = (config: OverlayConfig): NormalizedOverlayConfig => {
  return {
    id: config.id,
    positionX: config.positionX ?? 'center',
    positionY: config.positionY ?? 'center',
    fadeOnClose: config.fadeOnClose ?? true,
    closeTime: config.closeTime ?? 15,
    closeAllWindows: config.closeAllWindows ?? true,
    clearExisting: config.clearExisting ?? false,
    aboveUi: config.aboveUi ?? true,
    blockInteractions: config.blockInteractions ?? true
  }
}

const sleeper = (time: number) => new Promise(resolve => setTimeout(resolve, time))

const assertGM = (action: string) => {
  if(!(game as ReadyGame).user.isGM) {
    throw new Error(`Only GM users can ${action}.`)
  }
}

const getOverlayById = (id: string) => {
  return Array.from(document.querySelectorAll<HTMLElement>('.proscenium-overlay'))
    .find(overlay => overlay.dataset.prosceniumOverlayId === id);
}

const removeAllOverlays = async () => {
  await Promise.all(
    Array.from(document.querySelectorAll<HTMLElement>('.proscenium-overlay'), removeOverlay)
  );
}

const removeOverlay = async (overlay: HTMLElement) => {
  await stopOverlayAudio(overlay);
  overlay.remove();
}

const startOverlayAudio = (
  overlay: HTMLElement,
  audioConfig?: RuntimeTextOverlayAudioConfig
) => {
  if (!audioConfig) {
    return;
  }

  const controller = { canceled: false };
  const audio = createTransitionAudioController();
  const typingAudio = audio.startTyping(audioConfig.text, audioConfig.sounds, controller);
  if (!typingAudio) {
    return;
  }

  activeOverlayAudio.set(overlay, {
    controller,
    audio,
    typingAudio
  });
}

const stopOverlayAudio = async (overlay: HTMLElement) => {
  const state = activeOverlayAudio.get(overlay);
  if (!state) {
    return;
  }

  state.controller.canceled = true;
  await state.typingAudio?.stop();
  await state.audio.stopAll();
  activeOverlayAudio.delete(overlay);
}

const resolveTextOverlayAudio = (
  text: TextCrawlConfig,
  audio?: TextOverlayAudioConfig
): RuntimeTextOverlayAudioConfig | undefined => {
  if (!isTextCrawlTypewriterEffect(text)) {
    return undefined;
  }

  const profileType = resolveSceneTransitionSoundProfileType(
    audio?.profile ?? getDefaultTextOverlaySoundProfile(text)
  );
  const defaults = sceneTransitionSoundProfileDefaults[profileType];
  const sounds = {
    ...defaults,
    typingClick: audio?.overrides?.typing ?? defaults.typingClick,
    typingVolume: audio?.volume?.typing ?? defaults.typingVolume
  };
  if (!sounds.typingClick || sounds.typingVolume <= 0) {
    return undefined;
  }

  return {
    text,
    sounds
  };
}

const getDefaultTextOverlaySoundProfile = (text: TextCrawlConfig): SceneTransitionSoundProfileType => {
  return textOverlaySoundProfilesByTheme[getTextCrawlThemeType(text)];
}

const textOverlaySoundProfilesByTheme: Record<PresentationThemeType, SceneTransitionSoundProfileType> = {
  industrial: 'bulkhead',
  terminal: 'terminal',
  scanline: 'scanline',
  alert: 'alert',
  hologram: 'hologram',
  classified: 'classified',
  clean: 'silent'
};

type ClosableApplication = {
  close: () => Promise<unknown> | unknown;
  hasFrame?: boolean;
  rendered?: boolean;
};

const closeAllWindows = async () => {
  const applications = new Set<ClosableApplication>();

  for (const application of foundry.applications.instances.values()) {
    if (application.rendered && application.hasFrame) {
      applications.add(application);
    }
  }

  for (const application of Object.values(ui.windows)) {
    applications.add(application);
  }

  await Promise.allSettled(
    Array.from(applications, application => Promise.resolve().then(() => application.close()))
  );
};
