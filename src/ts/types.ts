import type { closeAllOverlays, closeOverlay } from './overlay';
import type {
  showHtmlOverlay,
  showTextOverlay,
  transitionToScene
} from './publicApi';

export type ProsceniumApi = {
  transitionToScene: ReturnType<typeof transitionToScene>;
  showTextOverlay: ReturnType<typeof showTextOverlay>;
  showHtmlOverlay: ReturnType<typeof showHtmlOverlay>;
  closeAllOverlays: ReturnType<typeof closeAllOverlays>;
  closeOverlay: ReturnType<typeof closeOverlay>;
};

export interface ProsceniumModule {
  api: ProsceniumApi;
  transitionToScene: ProsceniumApi['transitionToScene'];
  showTextOverlay: ProsceniumApi['showTextOverlay'];
  showHtmlOverlay: ProsceniumApi['showHtmlOverlay'];
  closeAllOverlays: ProsceniumApi['closeAllOverlays'];
  closeOverlay: ProsceniumApi['closeOverlay'];
}


export type Socketlib = {
  registerModule: (id: string) => ModuleSocket
}

export type ModuleSocket = {
  register: (method: string, handler: Function) => any;
  executeForEveryone: (method: string, ...args: any[]) => Promise<any>;
};
