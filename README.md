# Anarchist Overlay

Module for the Foundry VTT, allowing to render arbitrary HTML in a configurable overlay above the canvas for all users simultaneously. It also includes a method for getting HTML for mission briefing-like text crawl.

## Compatibility

Anarchist Overlay is compatible with Foundry VTT v13 and v14. It requires the [socketlib](https://github.com/farling42/foundryvtt-socketlib) module.

## Installation

Install using a manifest link:
```
https://github.com/reynevan24/anarchist-overlay/releases/latest/download/module.json
```

## Example usage:

Macro:
```js
const overlayConfig = {
  id: 'mission-briefing',
  positionX: 'start',
  positionY: 'center',
  clearExisting: true
};

const textConfig = {
  offsetX: '20px',
  offsetY: '0',
  typingTime: 2,
  delay: 1,
  blackBars: true,
  lines: [{
      text: 'MISSION 1: BUG HUNT',
      fontSize: '52px',
    },
    {
      text: 'COMBAT: TRAPDOOR SPIDER',
      fontSize: '38px',
    },
    {
      text: 'OBJECTIVE: SEARCH AND DESTROY',
      fontSize: '34px'
    },
    {
      text: 'EARLY SPRING, 5014U | HERCYNIA',
      fontSize: '20px'
    },
    {
      text: 'FOREST NEAR EVERGREEN | WEATHER: EXTREME HUMIDITY',
      fontSize: '20px'
    },
  ]
};

const anarchistOverlay = game.modules.get('anarchist-overlay').api;
const textHtml = await anarchistOverlay.createTextCrawlHtml(textConfig);

await anarchistOverlay.createOverlay(overlayConfig, textHtml);
```

The legacy API shape still works for existing macros:

```js
const anarchistOverlay = game.modules.get('anarchist-overlay');
const textHtml = await anarchistOverlay.createTextCrawlHtml(textConfig);
await anarchistOverlay.createOverlay(overlayConfig, textHtml);
```

Effect:

![Animation](https://user-images.githubusercontent.com/10486394/233835406-5a02eaf6-3374-491b-97ba-813512fab075.gif)

### Glitch Effect:

```js
const overlayConfig = {
    positionX: 'center',
    positionY: 'center',
    closeTime: 18,
    aboveUi: false,
    blockInteractions: false
}

const textConfig = {
    offsetX: '20px',
    offsetY: '0',
    typingTime: 1.5,
    delay: 0.5,
    blackBars: false,
    glitchEffect: { time: 0.5 },
    lines: [
      {
        text: '>//CC: FORCOMM X-X DESG:: “BROADCAST”',
        fontSize: '30px',
      },
      {
        text: '>//if:::HOSTILE=TRUE then:::',
        fontSize: '30px',
      },
      {
        text: '>//WIPE THEM ALL AWAY',
        fontSize: '30px'
      },
      {
        text: '>//EVERY SINGLE ONE OF THEM',
        fontSize: '30px'
      },
      {
        text: '>//KILL THEM WITH PREJUDICE LEAVE NO GROUND UNBURNED',
        fontSize: '30px'
      },
      {
        text: '>//if:::CINDERS ASH DARK SMOKE=TRUE then:::',
        fontSize: '30px'
      },
      {
        text: '>//AWAIT FURTHER TASKING',
        fontSize: '30px'
      },
    ]
  }


const anarchistOverlay = game.modules.get('anarchist-overlay').api;
const textHtml = await anarchistOverlay.createTextCrawlHtml(textConfig);

await anarchistOverlay.createOverlay(overlayConfig, textHtml);
```
![Animation-4](https://github.com/reynevan24/anarchist-overlay/assets/10486394/7a0c55be-2a1b-4bb2-b987-df6e6fc78b7d)

## API

All methods are available from `game.modules.get('anarchist-overlay').api`. For backwards compatibility, the same methods are also attached directly to the module object.

```js
const anarchistOverlay = game.modules.get('anarchist-overlay').api;
```

### `createOverlay(config, html)`

Creates an overlay on every connected client. This must be called by a GM.

```js
await anarchistOverlay.createOverlay({
  id: 'warning',
  positionX: 'center',
  positionY: 'center',
  closeTime: 0,
  clearExisting: true
}, '<h1>Evacuate immediately</h1>');
```

### `closeOverlay(id)`

Closes one overlay by id on every connected client. This must be called by a GM.

```js
await anarchistOverlay.closeOverlay('warning');
```

### `closeAllOverlays()`

Closes every Anarchist Overlay overlay on every connected client. This must be called by a GM.

```js
await anarchistOverlay.closeAllOverlays();
```

### `createTextCrawlHtml(config)`

Renders HTML for a text crawl that can be passed into `createOverlay`.

### `playSceneTransition(config)`

Plays a prototype scene transition on every connected client. This must be called by a GM. The transition closes animated industrial doors over the current scene, renders optional text crawl content, activates the target scene while the doors are closed, then opens the doors and fades the text. Press Escape during the transition to cancel the remaining animation and jump to the target scene.

```js
const anarchistOverlay = game.modules.get('anarchist-overlay').api;

await anarchistOverlay.playSceneTransition({
  sceneId: 'TARGET_SCENE_ID',
  text: {
    offsetX: '20px',
    offsetY: '0',
    typingTime: 2,
    delay: 1,
    blackBars: false,
    lines: [
      {
        text: 'MISSION 1: BUG HUNT',
        fontSize: '52px'
      },
      {
        text: 'COMBAT: TRAPDOOR SPIDER',
        fontSize: '38px'
      },
      {
        text: 'OBJECTIVE: SEARCH AND DESTROY',
        fontSize: '34px'
      }
    ]
  },
  timing: {
    closeMs: 2200,
    unlockMs: 700,
    openMs: 2400,
    textFadeMs: 900
  },
  sounds: {
    close: 'modules/anarchist-overlay/sounds/industrial-door-close.ogg',
    seal: 'modules/anarchist-overlay/sounds/industrial-door-seal.ogg',
    unlock: 'modules/anarchist-overlay/sounds/industrial-door-unlock.ogg',
    open: 'modules/anarchist-overlay/sounds/industrial-door-open.ogg',
    typingClick: 'modules/anarchist-overlay/sounds/mechanical-typing-click.ogg'
  }
});
```

## Config
```js
//Overlay config
export type OverlayConfig = {
  id?: string; // optional id, useful for closeOverlay
  positionX?: string; // 'start', 'center' or 'end'
  positionY?: string; // 'start', 'center' or 'end'
  fadeOnClose?: boolean; // should overlay fade out after closeTime
  closeTime?: number; // how long overlay should stay open, in seconds. Set to 0 to keep it open.
  closeAllWindows?: boolean; // should all Foundry windows (character sheets etc.) be closed when the overlay opens
  clearExisting?: boolean; // should existing Anarchist Overlay overlays be removed before creating this overlay
  aboveUi?: boolean; // should it render above or under UI
  blockInteractions?: boolean; // should it block interactions with canvas and/or UI (defaults to true)
}
//Text config
export type TextCrawlConfig = {
  offsetX?: string; // for example '15px'
  offsetY?: string; // for example '15px'
  typingTime?: number, // how long (in seconds) does the typing animation take per one line
  delay?: number, // how long (in seconds) does the typing animation pause before next line is typed
  blackBars?: boolean, // should black bars on top and bottom be rendered
  lines: { text: string, fontSize?: string }[], // list of lines to be rendered
  glitchEffect?: { time: number } | false; // adds a glitch effect. Should contain object with information how long should animation loop take
};

// Scene transition config
export type SceneTransitionConfig = {
  sceneId: string; // target scene id
  id?: string; // optional transition id, defaults to 'scene-transition'
  text?: TextCrawlConfig; // optional text crawl config rendered while doors are closed
  timing?: {
    closeMs?: number; // door close animation duration
    textMs?: number; // how long text remains before doors open. Defaults from text line timing.
    unlockMs?: number; // delay after the unlock sound before doors open
    openMs?: number; // door open animation duration
    textFadeMs?: number; // text fade duration after doors open
    sceneReadyTimeoutMs?: number; // max wait for the target scene canvas to be ready
  };
  sounds?: {
    close?: string; // optional local sound path for door close
    seal?: string; // optional local sound path for doors sealing shut
    unlock?: string; // optional local sound path before doors open
    open?: string; // optional local sound path for door open
    typing?: string; // optional local looping sound path while text renders
    typingClick?: string; // optional local click sound path scheduled with typed characters
    doorVolume?: number;
    typingVolume?: number;
  };
  aboveUi?: boolean; // defaults to true
  blockInteractions?: boolean; // defaults to true
};
```

## Security

`createOverlay` renders arbitrary GM-provided HTML for every connected client. Only trusted GM macros should call it. Do not pass unsanitized player-provided content into `createOverlay`.
