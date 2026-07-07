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

Text crawl frames can be set to `cinematic-bars`, `horizontal-bar`, `lower-third`, `panel`, `mission-card`, `chyron`, or `none`.

Themes can be set to `industrial`, `terminal`, `scanline`, `alert`, `hologram`, `classified`, or `clean`. Frames describe layout; themes describe the visual treatment. The default text theme depends on the frame: `panel` and `chyron` default to `terminal`, `none` and `cinematic-bars` default to `clean`, and the other frames default to `industrial`.

Text crawl effects can be set to `typewriter`, `scroll`, `stagger-fade`, `decode`, `wipe`, or `none`. Frames default to `typewriter`, except `chyron`, which defaults to `scroll`. The `scroll` effect is supported by `chyron` and `horizontal-bar`.

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
  theme: {
    type: 'industrial'
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

### Chyron

```js
const anarchistOverlay = game.modules.get('anarchist-overlay').api;

const textHtml = await anarchistOverlay.createTextCrawlHtml({
  frame: {
    type: 'chyron'
  },
  effect: {
    type: 'scroll',
    duration: 18,
    loop: true,
    separator: ' // '
  },
  lines: [
    {
      text: 'MISSION UPDATE: HOSTILE CONTACTS DETECTED',
      fontSize: '24px'
    },
    {
      text: 'OBJECTIVE: SECURE THE LANDING ZONE',
      fontSize: '24px'
    },
    {
      text: 'WEATHER: EXTREME HUMIDITY',
      fontSize: '24px'
    }
  ]
});

await anarchistOverlay.createOverlay({
  id: 'mission-chyron',
  positionX: 'center',
  positionY: 'center',
  closeTime: 18,
  clearExisting: true
}, textHtml);
```

Other frame types use the same text config shape:

```js
frame: { type: 'lower-third' }
frame: { type: 'panel' }
frame: { type: 'chyron' }
frame: { type: 'mission-card' }
```

Themes can be mixed with compatible frames:

```js
frame: { type: 'panel' }, theme: { type: 'terminal' }
frame: { type: 'panel' }, theme: { type: 'scanline' }
frame: { type: 'horizontal-bar' }, theme: { type: 'alert' }
frame: { type: 'mission-card' }, theme: { type: 'scanline' }
frame: { type: 'lower-third' }, theme: { type: 'hologram' }
frame: { type: 'mission-card' }, theme: { type: 'classified' }
```

### Additional Effects

`stagger-fade`, `decode`, and `wipe` use `effect.duration` for each line and `effect.lineDelay` for the pause between lines.

```js
const textHtml = await anarchistOverlay.createTextCrawlHtml({
  alignX: 'center',
  textAlign: 'start',
  maxWidth: '760px',
  frame: {
    type: 'mission-card'
  },
  theme: {
    type: 'industrial'
  },
  effect: {
    type: 'stagger-fade',
    duration: 0.75,
    lineDelay: 0.28
  },
  lines: [
    { text: 'MISSION 1: BUG HUNT', fontSize: '42px' },
    { text: 'COMBAT: TRAPDOOR SPIDER', fontSize: '28px' },
    { text: 'OBJECTIVE: SEARCH AND DESTROY', fontSize: '24px' }
  ]
});
```

```js
const textHtml = await anarchistOverlay.createTextCrawlHtml({
  maxWidth: '820px',
  frame: {
    type: 'panel'
  },
  theme: {
    type: 'scanline'
  },
  effect: {
    type: 'decode',
    duration: 1.15,
    lineDelay: 0.22
  },
  lines: [
    { text: '>//DROP ZONE TELEMETRY ACQUIRED', fontSize: '30px' },
    { text: '>//HOSTILE SIGNATURES DETECTED', fontSize: '24px' }
  ]
});
```

```js
const textHtml = await anarchistOverlay.createTextCrawlHtml({
  alignX: 'center',
  textAlign: 'center',
  frame: {
    type: 'horizontal-bar'
  },
  theme: {
    type: 'alert'
  },
  effect: {
    type: 'wipe',
    duration: 0.85,
    lineDelay: 0.18
  },
  lines: [
    { text: 'ARRIVAL VECTOR CONFIRMED', fontSize: '34px' },
    { text: 'DROP ZONE READY', fontSize: '24px' }
  ]
});
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
  theme: {
    type: 'industrial'
  },
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
  theme: {
    type: 'clean'
  },
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
  theme: {
    type: 'terminal'
  },
  transition: {
    type: 'horizontal-shutter',
    theme: {
      type: 'scanline'
    }
  },
  text: {
    typingTime: 1.5,
    delay: 0.5,
    alignX: 'center',
    textAlign: 'center',
    maxWidth: '760px',
    frame: {
      type: 'panel'
    },
    theme: {
      type: 'terminal'
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

The industrial door animation is used by default. Pass `theme`, `transition`, `timing`, or `sounds` only when you want to override the defaults. A top-level `theme` is inherited by transition text unless `text.theme` overrides it; `transition.theme` can separately theme the transition shell.

Scene transitions use theme-aware bundled sound defaults. Door sounds come from `transition.theme`; typing clicks come from `text.theme`. The `clean` theme is silent. Pass `sounds` to override any individual sound or volume.

The `sceneName` value must match exactly one scene. If no scene matches, or if multiple scenes share the same name, the GM receives an error notification and the transition is not started.

### Experimental Industrial Sounds

The default industrial door sounds are unchanged. Alternate industrial sound banks are bundled for testing and can be selected with `sounds`.

CC0 bulkhead:

```js
const ao = game.modules.get('anarchist-overlay').api;

await ao.playSceneTransition({
  sceneName: 'TARGET SCENE NAME',
  transition: {
    type: 'industrial-doors',
    theme: { type: 'industrial' }
  },
  text: {
    alignX: 'center',
    textAlign: 'center',
    maxWidth: '820px',
    frame: { type: 'mission-card' },
    theme: { type: 'industrial' },
    effect: { type: 'decode', duration: 1.1, lineDelay: 0.22 },
    lines: [
      { text: 'BULKHEAD SOUND TEST', fontSize: '44px' },
      { text: 'AIRLOCK CYCLE IN PROGRESS', fontSize: '26px' }
    ]
  },
  timing: {
    doorCloseMs: 2600,
    doorUnlockMs: 1500,
    doorOpenMs: 4100,
    textFadeMs: 900
  },
  sounds: {
    doorClose: 'modules/anarchist-overlay/sounds/industrial-bulkhead-close.ogg',
    doorSeal: 'modules/anarchist-overlay/sounds/industrial-bulkhead-seal.ogg',
    doorUnlock: 'modules/anarchist-overlay/sounds/industrial-bulkhead-unlock.ogg',
    doorOpen: 'modules/anarchist-overlay/sounds/industrial-bulkhead-open.ogg',
    doorVolume: 0.82
  }
});
```

The bulkhead bank is derived from CC0 Freesound sources:

- `industrial-bulkhead-close.ogg`: [lezaarth, "Electric Door"](https://freesound.org/people/lezaarth/sounds/316092/), reversed from about 1.0s to 3.6s for movement without the terminal impact.
- `industrial-bulkhead-seal.ogg`: [SecureSubset, "Large Metal Bunker Doors, Opening and Closing, Resonances"](https://freesound.org/people/SecureSubset/sounds/845666/), cut from about 9.5s to 11.5s so the impact starts immediately when the seal cue plays.
- `industrial-bulkhead-unlock.ogg`: [Velvorn, "sas_fermeture.WAV"](https://freesound.org/people/Velvorn/sounds/95772/), cut from the opening 1.55s.
- `industrial-bulkhead-open.ogg`: [lezaarth, "Electric Door"](https://freesound.org/people/lezaarth/sounds/316092/), cut from about 1.0s to 5.1s.

Heavy mechanical:

```js
const ao = game.modules.get('anarchist-overlay').api;

await ao.playSceneTransition({
  sceneName: 'TARGET SCENE NAME',
  transition: {
    type: 'industrial-doors',
    theme: { type: 'industrial' }
  },
  text: {
    alignX: 'center',
    textAlign: 'center',
    maxWidth: '820px',
    frame: { type: 'mission-card' },
    theme: { type: 'industrial' },
    lines: [
      { text: 'HEAVY DOOR TEST', fontSize: '44px' },
      { text: 'MECHANICAL OVERRIDE ENGAGED', fontSize: '26px' }
    ]
  },
  sounds: {
    doorClose: 'modules/anarchist-overlay/sounds/industrial-heavy-close.ogg',
    doorSeal: 'modules/anarchist-overlay/sounds/industrial-heavy-seal.ogg',
    doorUnlock: 'modules/anarchist-overlay/sounds/industrial-heavy-unlock.ogg',
    doorOpen: 'modules/anarchist-overlay/sounds/industrial-heavy-open.ogg',
    doorVolume: 0.82
  }
});
```

Harsh mechanical:

```js
const ao = game.modules.get('anarchist-overlay').api;

await ao.playSceneTransition({
  sceneName: 'TARGET SCENE NAME',
  transition: {
    type: 'industrial-doors',
    theme: { type: 'industrial' }
  },
  text: {
    alignX: 'center',
    textAlign: 'center',
    maxWidth: '820px',
    frame: { type: 'horizontal-bar' },
    theme: { type: 'alert' },
    effect: { type: 'wipe', duration: 0.85, lineDelay: 0.18 },
    lines: [
      { text: 'HARSH DOOR TEST', fontSize: '40px' },
      { text: 'BULKHEAD CYCLING', fontSize: '24px' }
    ]
  },
  sounds: {
    doorClose: 'modules/anarchist-overlay/sounds/industrial-harsh-close.ogg',
    doorSeal: 'modules/anarchist-overlay/sounds/industrial-harsh-seal.ogg',
    doorUnlock: 'modules/anarchist-overlay/sounds/industrial-harsh-unlock.ogg',
    doorOpen: 'modules/anarchist-overlay/sounds/industrial-harsh-open.ogg',
    doorVolume: 0.72
  }
});
```

### Macro Helper Patterns

These are plain macro helpers layered over the module API. They are useful if you want consistent formatting without repeating the same config in every scene macro.

```js
const ao = game.modules.get('anarchist-overlay').api;

const missionLines = entries => entries.map(([text, fontSize]) => ({ text, fontSize }));

const briefingText = ({
  frame = 'mission-card',
  theme = 'industrial',
  effect = 'typewriter',
  alignX = 'center',
  textAlign = 'start',
  maxWidth = '820px',
  lines
}) => ({
  alignX,
  textAlign,
  maxWidth,
  typingTime: 1.6,
  delay: 0.35,
  frame: { type: frame },
  theme: { type: theme },
  effect: { type: effect },
  lines
});
```

Use that helper for a standalone overlay:

```js
const textHtml = await ao.createTextCrawlHtml(briefingText({
  frame: 'horizontal-bar',
  theme: 'hologram',
  textAlign: 'center',
  lines: missionLines([
    ['DROP ZONE TELEMETRY ACQUIRED', '34px'],
    ['HOSTILE SIGNATURES DETECTED', '24px']
  ])
}));

await ao.createOverlay({
  id: 'telemetry-update',
  positionX: 'center',
  positionY: 'center',
  closeTime: 8,
  clearExisting: true
}, textHtml);
```

Or wrap the full scene transition:

```js
async function playMissionTransition(sceneName, entries, options = {}) {
  return ao.playSceneTransition({
    sceneName,
    theme: {
      type: options.theme ?? 'industrial'
    },
    transition: {
      type: options.transition ?? 'industrial-doors',
      theme: {
        type: options.transitionTheme ?? options.theme ?? 'industrial'
      }
    },
    text: briefingText({
      frame: options.frame ?? 'mission-card',
      theme: options.textTheme ?? options.theme ?? 'industrial',
      effect: options.effect ?? 'typewriter',
      lines: missionLines(entries)
    }),
    timing: {
      doorCloseMs: 2200,
      doorUnlockMs: 700,
      doorOpenMs: 2400,
      textFadeMs: 900
    }
  });
}

await playMissionTransition('Sandbox', [
  ['MISSION 1: BUG HUNT', '52px'],
  ['COMBAT: TRAPDOOR SPIDER', '38px'],
  ['OBJECTIVE: SEARCH AND DESTROY', '34px'],
  ['EARLY SPRING, 5014U | HERCYNIA', '20px']
], {
  transitionTheme: 'classified',
  textTheme: 'hologram',
  effect: 'decode'
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
export type TextCrawlFrameType =
  | 'none'
  | 'cinematic-bars'
  | 'horizontal-bar'
  | 'lower-third'
  | 'chyron'
  | 'panel'
  | 'mission-card';
export type PresentationThemeType =
  | 'industrial'
  | 'terminal'
  | 'scanline'
  | 'alert'
  | 'hologram'
  | 'classified'
  | 'clean';
export type TextCrawlEffectType =
  | 'typewriter'
  | 'scroll'
  | 'stagger-fade'
  | 'decode'
  | 'wipe'
  | 'none';
export type TextCrawlAlignment = 'start' | 'center' | 'end';

export type TextCrawlConfig = {
  offsetX?: string; // for example '15px'. Applied after alignX.
  offsetY?: string; // for example '15px'
  alignX?: TextCrawlAlignment; // positions the text block. Default: 'start'
  textAlign?: TextCrawlAlignment; // aligns each line inside the text block. Default: 'start'
  maxWidth?: string; // max text block width. Defaults to the longest rendered line.
  typingTime?: number, // typewriter effect duration in seconds per line
  delay?: number, // typewriter pause in seconds before the next line is typed
  frame?: {
    type?: TextCrawlFrameType; // defaults to 'cinematic-bars'
  };
  theme?: {
    type?: PresentationThemeType; // defaults from the frame type
  };
  effect?: {
    type?: TextCrawlEffectType; // defaults to 'typewriter', or 'scroll' for the 'chyron' frame
    duration?: number; // effect duration in seconds. Scroll default: 18
    lineDelay?: number; // delay in seconds between animated lines for stagger-fade, decode, and wipe.
    loop?: boolean; // should scroll repeat. Defaults to true for scroll.
    separator?: string; // text between scroll items. Default: ' // '
  };
  lines: { text: string, fontSize?: string }[], // list of lines to be rendered
  glitchEffect?: { time: number } | false; // adds a glitch effect. Should contain object with information how long should animation loop take
};

// Scene transition config
export type SceneTransitionType = 'industrial-doors' | 'horizontal-shutter' | 'fade';

export type SceneTransitionConfig = {
  sceneName: string; // target scene name. Must match exactly and be unique.
  id?: string; // optional transition id, defaults to 'scene-transition'
  theme?: {
    type?: PresentationThemeType; // default theme for transition text when text.theme is not set
  };
  transition?: {
    type?: SceneTransitionType; // defaults to 'industrial-doors'
    theme?: {
      type?: PresentationThemeType; // defaults from the top-level theme, then 'industrial'
    };
  };
  text?: TextCrawlConfig; // optional text crawl config rendered while doors are closed
  timing?: {
    doorCloseMs?: number; // door close animation duration. Default: 2200
    briefingMs?: number; // how long text remains before doors open. Defaults from the text effect duration.
    doorUnlockMs?: number; // delay after the unlock sound before doors open. Default: 700
    doorOpenMs?: number; // door open animation duration. Default: 2400
    fadeOutMs?: number; // fade-to-black animation duration. Default: 1200
    fadeInMs?: number; // fade-from-black animation duration. Default: 1200
    textFadeMs?: number; // text fade duration before the transition reveal completes. Default: 900
    sceneReadyTimeoutMs?: number; // max wait for the target scene canvas to be ready. Default: 10000
  };
  sounds?: {
    doorClose?: string; // local sound path for door close. Defaults from transition.theme.
    doorSeal?: string; // local sound path for doors sealing shut. Defaults from transition.theme.
    doorUnlock?: string; // local sound path before doors open. Defaults from transition.theme.
    doorOpen?: string; // local sound path for door open. Defaults from transition.theme.
    typingClick?: string; // local click sound path scheduled with typed characters for typewriter text. Defaults from text.theme.
    doorVolume?: number; // defaults from transition.theme
    typingVolume?: number; // defaults from text.theme
  };
  aboveUi?: boolean; // defaults to true
  blockInteractions?: boolean; // defaults to true
};
```

## Security

`createOverlay` renders arbitrary GM-provided HTML for every connected client. Only trusted GM macros should call it. Do not pass unsanitized player-provided content into `createOverlay`.
