// Do not remove this import. If you do Vite will think your styles are dead
// code and not include them in the build output.
import '../styles/overlay.scss';
import '../styles/text-crawl.scss';
import '../styles/scene-transition.scss';

import type { ProsceniumApi, ProsceniumModule } from './types';
import { setupSocket } from './socket';
import { closeAllOverlays, closeOverlay, setupOverlaySocket } from './overlay';
import { setupSceneTransitionSocket } from './sceneTransition';
import { moduleId } from "./constants";
import { showHtmlOverlay, showTextOverlay, transitionToScene } from './publicApi';

Hooks.once('socketlib.ready', () => {
  const module = (game as ReadyGame).modules.get(moduleId) as unknown as ProsceniumModule | undefined;
  if (!module) {
    throw new Error(`Unable to initialize ${moduleId}: module data was not found.`);
  }

  const socket = setupSocket();
  setupOverlaySocket(socket);
  setupSceneTransitionSocket(socket);

  const api: ProsceniumApi = {
    transitionToScene: transitionToScene(socket),
    showTextOverlay: showTextOverlay(socket),
    showHtmlOverlay: showHtmlOverlay(socket),
    closeAllOverlays: closeAllOverlays(socket),
    closeOverlay: closeOverlay(socket)
  };

  module.api = api;
  module.transitionToScene = api.transitionToScene;
  module.showTextOverlay = api.showTextOverlay;
  module.showHtmlOverlay = api.showHtmlOverlay;
  module.closeAllOverlays = api.closeAllOverlays;
  module.closeOverlay = api.closeOverlay;
});
