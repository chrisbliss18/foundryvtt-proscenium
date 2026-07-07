# Anarchist Overlay

Module for the Foundry VTT, allowing to render arbitrary HTML in a configurable overlay above the canvas for all users simultaneously. It also includes a method for getting HTML for mission briefing-like text crawl.

## Compatibility

Anarchist Overlay is compatible with Foundry VTT v13 and v14. It requires the [socketlib](https://github.com/farling42/foundryvtt-socketlib) module.

## Installation

Install using a manifest link:
```
https://github.com/reynevan24/anarchist-overlay/releases/latest/download/module.json
```

## Example Usage

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
  frame: {
    type: 'cinematic-bars'
  },
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

Text crawl frames can be set to `cinematic-bars`, `horizontal-bar`, `lower-third`, `terminal-panel`, `alert-banner`, or `none`.

### Horizontal Bar

```js
const anarchistOverlay = game.modules.get('anarchist-overlay').api;

const textHtml = await anarchistOverlay.createTextCrawlHtml({
  typingTime: 1.2,
  delay: 0.3,
  alignX: 'center',
  textAlign: 'center',
  maxWidth: '720px',
  frame: {
    type: 'horizontal-bar'
  },
  lines: [
    {
      text: 'SITREP UPDATED',
      fontSize: '34px'
    },
    {
      text: 'HOSTILE CONTACTS DETECTED',
      fontSize: '24px'
    }
  ]
});

await anarchistOverlay.createOverlay({
  id: 'sitrep-update',
  positionX: 'center',
  positionY: 'center',
  closeTime: 8,
  clearExisting: true
}, textHtml);
```

Use `alignX` to position the text block, `textAlign` to align lines inside that block, and `maxWidth` to cap the block width. By default, the text block is only as wide as the longest rendered line.

Other frame types use the same text config shape:

```js
frame: { type: 'lower-third' }
frame: { type: 'terminal-panel' }
frame: { type: 'alert-banner' }
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
    frame: {
      type: 'none'
    },
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

All methods are available from `game.modules.get('anarchist-overlay').api`.

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

Plays a scene transition on every connected client. This must be called by a GM. Supported transition types are `industrial-doors`, `horizontal-shutter`, and `fade`. Press Escape during the transition to locally cancel the remaining animation on only your client.

```js
const anarchistOverlay = game.modules.get('anarchist-overlay').api;

await anarchistOverlay.playSceneTransition({
  sceneName: 'TARGET SCENE NAME',
  transition: {
    type: 'industrial-doors'
  },
  text: {
    offsetX: '20px',
    offsetY: '0',
    typingTime: 2,
    delay: 1,
    frame: {
      type: 'none'
    },
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
    doorCloseMs: 2200,
    doorUnlockMs: 700,
    doorOpenMs: 2400,
    textFadeMs: 900
  }
});
```

For a simple fade transition:

```js
await anarchistOverlay.playSceneTransition({
  sceneName: 'TARGET SCENE NAME',
  transition: {
    type: 'fade'
  },
  text: {
    typingTime: 1.5,
    delay: 0.5,
    alignX: 'center',
    textAlign: 'center',
    maxWidth: '760px',
    frame: {
      type: 'horizontal-bar'
    },
    lines: [
      {
        text: 'ARRIVAL VECTOR CONFIRMED',
        fontSize: '34px'
      },
      {
        text: 'DROP ZONE: SECURE FOR DEPLOYMENT',
        fontSize: '24px'
      }
    ]
  },
  timing: {
    fadeOutMs: 1200,
    fadeInMs: 1200,
    textFadeMs: 700
  }
});
```

For a top-and-bottom shutter transition:

```js
await anarchistOverlay.playSceneTransition({
  sceneName: 'TARGET SCENE NAME',
  transition: {
    type: 'horizontal-shutter'
  },
  text: {
    typingTime: 1.5,
    delay: 0.5,
    alignX: 'center',
    textAlign: 'center',
    maxWidth: '760px',
    frame: {
      type: 'terminal-panel'
    },
    lines: [
      {
        text: 'AIRLOCK CYCLE COMPLETE',
        fontSize: '34px'
      },
      {
        text: 'MISSION AREA READY',
        fontSize: '24px'
      }
    ]
  }
});
```

The industrial door animation and bundled transition sounds are used by default. Pass `transition`, `timing`, or `sounds` only when you want to override the defaults.

Bundled sound defaults live under `modules/anarchist-overlay/sounds/`: `industrial-door-close.ogg`, `industrial-door-seal.ogg`, `industrial-door-unlock.ogg`, `industrial-door-open.ogg`, and `mechanical-typing-click.ogg`.

The `sceneName` value must match exactly one scene. If no scene matches, or if multiple scenes share the same name, the GM receives an error notification and the transition is not started.

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
export type TextCrawlFrameType =
  | 'none'
  | 'cinematic-bars'
  | 'horizontal-bar'
  | 'lower-third'
  | 'terminal-panel'
  | 'alert-banner';
export type TextCrawlAlignment = 'start' | 'center' | 'end';

export type TextCrawlConfig = {
  offsetX?: string; // for example '15px'. Applied after alignX.
  offsetY?: string; // for example '15px'
  alignX?: TextCrawlAlignment; // positions the text block. Default: 'start'
  textAlign?: TextCrawlAlignment; // aligns each line inside the text block. Default: 'start'
  maxWidth?: string; // max text block width. Defaults to the longest rendered line.
  typingTime?: number, // how long (in seconds) does the typing animation take per one line
  delay?: number, // how long (in seconds) does the typing animation pause before next line is typed
  frame?: {
    type?: TextCrawlFrameType; // defaults to 'cinematic-bars'
  };
  lines: { text: string, fontSize?: string }[], // list of lines to be rendered
  glitchEffect?: { time: number } | false; // adds a glitch effect. Should contain object with information how long should animation loop take
};

// Scene transition config
export type SceneTransitionType = 'industrial-doors' | 'horizontal-shutter' | 'fade';

export type SceneTransitionConfig = {
  sceneName: string; // target scene name. Must match exactly and be unique.
  id?: string; // optional transition id, defaults to 'scene-transition'
  transition?: {
    type?: SceneTransitionType; // defaults to 'industrial-doors'
  };
  text?: TextCrawlConfig; // optional text crawl config rendered while doors are closed
  timing?: {
    doorCloseMs?: number; // door close animation duration. Default: 2200
    briefingMs?: number; // how long text remains before doors open. Defaults from text line timing.
    doorUnlockMs?: number; // delay after the unlock sound before doors open. Default: 700
    doorOpenMs?: number; // door open animation duration. Default: 2400
    fadeOutMs?: number; // fade-to-black animation duration. Default: 1200
    fadeInMs?: number; // fade-from-black animation duration. Default: 1200
    textFadeMs?: number; // text fade duration before the transition reveal completes. Default: 900
    sceneReadyTimeoutMs?: number; // max wait for the target scene canvas to be ready. Default: 10000
  };
  sounds?: {
    doorClose?: string; // local sound path for door close. Defaults to the bundled sound.
    doorSeal?: string; // local sound path for doors sealing shut. Defaults to the bundled sound.
    doorUnlock?: string; // local sound path before doors open. Defaults to the bundled sound.
    doorOpen?: string; // local sound path for door open. Defaults to the bundled sound.
    typingClick?: string; // local click sound path scheduled with typed characters. Defaults to the bundled sound.
    doorVolume?: number; // default: 0.8
    typingVolume?: number; // default: 0.35
  };
  aboveUi?: boolean; // defaults to true
  blockInteractions?: boolean; // defaults to true
};
```

## Security

`createOverlay` renders arbitrary GM-provided HTML for every connected client. Only trusted GM macros should call it. Do not pass unsanitized player-provided content into `createOverlay`.
