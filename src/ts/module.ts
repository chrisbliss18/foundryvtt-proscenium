// Do not remove this import. If you do Vite will think your styles are dead
// code and not include them in the build output.
import '../styles/overlay.scss';
import '../styles/text-crawl.scss';

import { AnarchistOverlayModule } from './types';
import { setupSocket } from './socket';
import { createOverlay, setupOverlaySocket } from './overlay';
import { moduleId } from "./constants";
import {createTextCrawlHtml} from "./textCrawl";

Hooks.once('socketlib.ready', () => {
  const module = (game as ReadyGame).modules.get(moduleId) as unknown as AnarchistOverlayModule | undefined;
  if (!module) {
    throw new Error(`Unable to initialize ${moduleId}: module data was not found.`);
  }

  const socket = setupSocket();
  setupOverlaySocket(socket);
  module.createOverlay = createOverlay(socket);
  module.createTextCrawlHtml = createTextCrawlHtml;
});
