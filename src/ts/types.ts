import type { closeAllOverlays, closeOverlay } from './overlay';
import type {
  showHtmlOverlay,
  showTextOverlay,
  transitionToScene
} from './publicApi';

export type AnarchistOverlayApi = {
  transitionToScene: ReturnType<typeof transitionToScene>;
  showTextOverlay: ReturnType<typeof showTextOverlay>;
  showHtmlOverlay: ReturnType<typeof showHtmlOverlay>;
  closeAllOverlays: ReturnType<typeof closeAllOverlays>;
  closeOverlay: ReturnType<typeof closeOverlay>;
};

export interface AnarchistOverlayModule {
  api: AnarchistOverlayApi;
  transitionToScene: AnarchistOverlayApi['transitionToScene'];
  showTextOverlay: AnarchistOverlayApi['showTextOverlay'];
  showHtmlOverlay: AnarchistOverlayApi['showHtmlOverlay'];
  closeAllOverlays: AnarchistOverlayApi['closeAllOverlays'];
  closeOverlay: AnarchistOverlayApi['closeOverlay'];
}


export type Socketlib = {
  registerModule: (id: string) => ModuleSocket
}

export type ModuleSocket = {
  register: (method: string, handler: Function) => any;
  executeForEveryone: (method: string, ...args: any[]) => Promise<any>;
};
