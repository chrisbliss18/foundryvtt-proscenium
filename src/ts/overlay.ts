import type { ModuleSocket } from './types';
import {moduleId} from "./constants";

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

type NormalizedOverlayConfig = Required<Omit<OverlayConfig, 'id'>> & Pick<OverlayConfig, 'id'>;

export const createOverlay = (socket: ModuleSocket) => (config: OverlayConfig, html: string) => {
  assertGM('create overlays');
  return socket.executeForEveryone('createOverlay', config, html);
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
  socket.register('closeOverlay', handleOverlayClose);
  socket.register('closeAllOverlays', handleAllOverlayClose);
}



const handleOverlayCreation = async (config: OverlayConfig, html: string) => {
  const normalizedConfig = normalizeConfig(config);
  if(normalizedConfig.clearExisting) {
    removeAllOverlays();
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

  if(normalizedConfig.closeAllWindows) {
    await closeAllWindows();
  }

  if(normalizedConfig.closeTime > 0) {
    await handleClosingOverlay(overlay, normalizedConfig);
  }

  return overlay;
};

const handleOverlayClose = (id: string) => {
  const overlay = getOverlayById(id);
  overlay?.remove();
}

const handleAllOverlayClose = () => {
  removeAllOverlays();
}

const handleClosingOverlay = async (overlay: HTMLElement, config: NormalizedOverlayConfig) => {
  await sleeper(config.closeTime * 1000);
  if(config.fadeOnClose) {
    overlay.classList.add('fade-out');
    await sleeper(2000);
  }
  overlay.remove();
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

const removeAllOverlays = () => {
  document.querySelectorAll<HTMLElement>('.proscenium-overlay').forEach(overlay => overlay.remove());
}

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
