import type { closeAllOverlays, closeOverlay, createOverlay } from './overlay';
import type { createTextCrawlHtml } from "./textCrawl";

export type AnarchistOverlayApi = {
  createOverlay: ReturnType<typeof createOverlay>;
  createTextCrawlHtml: typeof createTextCrawlHtml;
  closeAllOverlays: ReturnType<typeof closeAllOverlays>;
  closeOverlay: ReturnType<typeof closeOverlay>;
};

export interface AnarchistOverlayModule {
  api: AnarchistOverlayApi;
  createOverlay: AnarchistOverlayApi['createOverlay'];
  createTextCrawlHtml: AnarchistOverlayApi['createTextCrawlHtml'];
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
