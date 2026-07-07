import type {
  NormalizedSceneTransitionConfig,
  TransitionController
} from './sceneTransitionTypes';

const transitionFallbackMs = 250;

export const createTransitionOverlay = (config: NormalizedSceneTransitionConfig) => {
  const overlay = document.createElement('div');
  overlay.className = [
    'proscenium-overlay',
    'proscenium-scene-transition',
    `scene-transition--${config.transition.type}`,
    `scene-transition--theme-${config.transition.theme.type}`,
    config.transition.type === 'split-door' ? 'doors-open' : '',
    config.transition.type === 'horizontal-shutter' ? 'shutters-open' : '',
    config.aboveUi ? 'above-ui' : '',
    config.blockInteractions ? 'block-interactions' : ''
  ].filter(Boolean).join(' ');
  overlay.dataset.prosceniumOverlay = 'true';
  overlay.dataset.prosceniumOverlayId = config.id;
  overlay.style.setProperty('--door-close-duration', `${config.timing.doorCloseMs}ms`);
  overlay.style.setProperty('--door-open-duration', `${config.timing.doorOpenMs}ms`);
  overlay.style.setProperty('--fade-out-duration', `${config.timing.fadeOutMs}ms`);
  overlay.style.setProperty('--fade-in-duration', `${config.timing.fadeInMs}ms`);
  overlay.style.setProperty('--text-fade-duration', `${config.timing.textFadeMs}ms`);
  overlay.innerHTML = `
    <div class="proscenium-scene-transition__fade"></div>
    <div class="proscenium-scene-transition__door proscenium-scene-transition__door--left">
      <div class="proscenium-scene-transition__door-rib"></div>
      <div class="proscenium-scene-transition__door-rib"></div>
      <div class="proscenium-scene-transition__door-rib"></div>
      <div class="proscenium-scene-transition__hazard"></div>
    </div>
    <div class="proscenium-scene-transition__door proscenium-scene-transition__door--right">
      <div class="proscenium-scene-transition__door-rib"></div>
      <div class="proscenium-scene-transition__door-rib"></div>
      <div class="proscenium-scene-transition__door-rib"></div>
      <div class="proscenium-scene-transition__hazard"></div>
    </div>
    <div class="proscenium-scene-transition__seam" aria-hidden="true"></div>
    <div class="proscenium-scene-transition__shutter proscenium-scene-transition__shutter--top">
      <div class="proscenium-scene-transition__shutter-rib"></div>
      <div class="proscenium-scene-transition__shutter-rib"></div>
    </div>
    <div class="proscenium-scene-transition__shutter proscenium-scene-transition__shutter--bottom">
      <div class="proscenium-scene-transition__shutter-rib"></div>
      <div class="proscenium-scene-transition__shutter-rib"></div>
    </div>
    <div class="proscenium-scene-transition__text"></div>
  `;

  return overlay;
};

export const removeExistingTransition = (id: string) => {
  Array.from(document.querySelectorAll<HTMLElement>('.proscenium-scene-transition'))
    .filter(overlay => overlay.dataset.prosceniumOverlayId === id)
    .forEach(overlay => overlay.remove());
};

export const getDoorElement = (overlay: HTMLElement) => {
  return overlay.querySelector<HTMLElement>('.proscenium-scene-transition__door--left');
};

export const getFadeElement = (overlay: HTMLElement) => {
  return overlay.querySelector<HTMLElement>('.proscenium-scene-transition__fade');
};

export const getShutterElement = (overlay: HTMLElement) => {
  return overlay.querySelector<HTMLElement>('.proscenium-scene-transition__shutter--top');
};

export const getTextElement = (overlay: HTMLElement) => {
  return overlay.querySelector<HTMLElement>('.proscenium-scene-transition__text');
};

export const prepareOverlayForAnimation = async (overlay: HTMLElement) => {
  await nextFrame();
  void overlay.offsetWidth;
  await nextFrame();
};

export const waitForTransition = async (
  element: HTMLElement | null,
  propertyName: string,
  durationMs: number,
  controller: TransitionController
) => {
  if (!element) {
    return waitForDelay(durationMs, controller);
  }

  await Promise.race([
    new Promise<void>(resolve => {
      let timeoutId: number | undefined;
      const done = () => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        element.removeEventListener('transitionend', handleTransitionEnd);
        resolve();
      };
      const handleTransitionEnd = (event: TransitionEvent) => {
        if (event.target === element && event.propertyName === propertyName) {
          done();
        }
      };
      timeoutId = window.setTimeout(done, durationMs + transitionFallbackMs);
      element.addEventListener('transitionend', handleTransitionEnd);
    }),
    controller.cancelPromise
  ]);

  return controller.canceled;
};

export const waitForDelay = async (durationMs: number, controller: TransitionController) => {
  await Promise.race([sleeper(durationMs), controller.cancelPromise]);
  return controller.canceled;
};

const sleeper = (time: number) => new Promise(resolve => window.setTimeout(resolve, time));

const nextFrame = () => new Promise(resolve => window.requestAnimationFrame(resolve));
