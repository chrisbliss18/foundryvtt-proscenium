import { ModuleSocket } from './types';
import {moduleId} from "./constants";

export type OverlayConfig = {
  positionX?: string;
  positionY?: string;
  fadeOnClose?: boolean;
  closeTime?: number;
  closeAllWindows?: boolean;
  aboveUi?: boolean;
  blockInteractions?: boolean;
}

type NormalizedOverlayConfig = Required<OverlayConfig>;

export const createOverlay = (socket: ModuleSocket) => (config: OverlayConfig, html: string) => {
  if(!(game as ReadyGame).user.isGM) {
    throw new Error('Only GM can create overlays.')
  }
  return socket.executeForEveryone('createOverlay', config, html);
}
export const setupOverlaySocket = (socket: ModuleSocket) => {
  socket.register('createOverlay', handleOverlayCreation);
}



const handleOverlayCreation = async (config: OverlayConfig, html: string) => {
  const normalizedConfig = normalizeConfig(config);
  const template = await renderTemplate(`modules/${moduleId}/templates/overlay.hbs`, normalizedConfig);
  const wrapper = document.createElement('template');
  wrapper.innerHTML = template.trim();
  const overlay = wrapper.content.firstElementChild;
  if (!(overlay instanceof HTMLElement)) {
    throw new Error('Unable to render overlay template.');
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
    positionX: config.positionX ?? 'center',
    positionY: config.positionY ?? 'center',
    fadeOnClose: config.fadeOnClose ?? true,
    closeTime: config.closeTime ?? 15,
    closeAllWindows: config.closeAllWindows ?? true,
    aboveUi: config.aboveUi ?? true,
    blockInteractions: config.blockInteractions ?? true
  }
}

const sleeper = (time: number) => new Promise(resolve => setTimeout(resolve, time))

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
