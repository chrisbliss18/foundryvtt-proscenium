# Proscenium

Proscenium is a system-agnostic Foundry VTT module for cinematic table presentation. It gives GMs a macro-friendly API for scene transitions, mission briefings, lower-third messages, scrolling chyrons, and trusted HTML overlays shown to connected clients.

It is designed for moments where a scene change or table message should feel intentional: a location reveal, a mission briefing, a radio transmission, a warning banner, or a dramatic fade between scenes.

## Compatibility

Proscenium is compatible with Foundry VTT v13 and v14. It requires the [socketlib](https://github.com/farling42/foundryvtt-socketlib) module.

## License and Attribution

Proscenium is released under the MIT License.

This project began as a fork of [Anarchist Overlay](https://github.com/reynevan24/anarchist-overlay) by Szymon Baranczyk. The module has since been renamed and expanded into a broader system-agnostic presentation toolkit.

## Installation

Install using a manifest link:

```txt
https://github.com/chrisbliss18/foundryvtt-proscenium/releases/latest/download/module.json
```

## API Model

All public methods are available from:

```js
const proscenium = game.modules.get('proscenium').api;
```

The public API is organized around three actions:

```js
proscenium.transitionToScene(config)
proscenium.showTextOverlay(config)
proscenium.showHtmlOverlay(config)
```

Use `transitionToScene` for scene activation with a cinematic reveal, `showTextOverlay` for styled text without a scene change, and `showHtmlOverlay` only when you intentionally need raw GM-provided HTML.

Manual verification macros are available in [docs/test-macros.md](docs/test-macros.md).

## Scene Transitions

```js
const proscenium = game.modules.get('proscenium').api;

await proscenium.transitionToScene({
  scene: {
    name: 'Sandbox'
  },
  preset: 'bulkhead',
  transition: {
    type: 'split-door',
    style: 'industrial'
  },
  briefing: {
    frame: 'mission-card',
    style: 'hologram',
    layout: {
      align: 'center',
      textAlign: 'center',
      maxWidth: '820px'
    },
    animation: {
      type: 'decode',
      durationMs: 1100,
      lineDelayMs: 220
    },
    lines: [
      { text: 'MISSION 1: BUG HUNT', fontSize: '52px' },
      { text: 'COMBAT: TRAPDOOR SPIDER', fontSize: '38px' },
      { text: 'OBJECTIVE: SEARCH AND DESTROY', fontSize: '34px' }
    ]
  }
});
```

The scene name must match exactly one scene. If no scene matches, or if multiple scenes share the same name, the GM receives an error notification and the transition is not started.

Press Escape during a scene transition to skip the remaining animation locally on that client. Other clients continue normally.

## Core Concepts

- `preset`: convenience defaults for transition motion, timeline, and audio.
- `transition`: visual scene reveal animation.
- `style`: visual treatment. Styles do not choose sounds.
- `briefing`: text/content shown during the transition or overlay.
- `audio.profile`: bundled sound bank.
- `audio.overrides`: manual replacement for individual sound files.
- `timeline`: transition timing in milliseconds.
- `behavior`: client/UI behavior such as interaction blocking.

## Presets

Available presets:

```js
'bulkhead'
'quick-alert'
'silent-fade'
```

`bulkhead` is the default. It uses the split-door animation, industrial styling, the CC0 bulkhead sound profile, and timings tuned to that sound bank.

Presets are only defaults. Override any part explicitly:

```js
await proscenium.transitionToScene({
  scene: { name: 'Sandbox' },
  preset: 'bulkhead',
  transition: {
    type: 'horizontal-shutter',
    style: 'classified'
  },
  audio: {
    profile: 'silent'
  },
  briefing: {
    frame: 'panel',
    style: 'classified',
    lines: [
      { text: 'RESTRICTED AREA ENTERED', fontSize: '38px' }
    ]
  }
});
```

## Transition Types

Available transition types:

```js
'split-door'
'horizontal-shutter'
'fade'
```

Available styles:

```js
'industrial'
'terminal'
'scanline'
'alert'
'hologram'
'classified'
'clean'
```

## Sound Profiles

Available audio profiles:

```js
'bulkhead'
'classic-industrial'
'heavy-industrial'
'harsh-industrial'
'terminal'
'scanline'
'alert'
'hologram'
'classified'
'silent'
```

Use `audio.profile` to select a bundled bank:

```js
await proscenium.transitionToScene({
  scene: { name: 'Sandbox' },
  transition: {
    type: 'split-door',
    style: 'industrial'
  },
  audio: {
    profile: 'bulkhead'
  },
  briefing: {
    frame: 'mission-card',
    lines: [
      { text: 'BULKHEAD SOUND TEST', fontSize: '44px' }
    ]
  }
});
```

Use `audio.overrides` for custom files:

```js
audio: {
  profile: 'bulkhead',
  volume: {
    doors: 0.82,
    typing: 0.35
  },
  overrides: {
    close: 'modules/proscenium/sounds/custom-close.ogg',
    seal: 'modules/proscenium/sounds/custom-seal.ogg',
    unlock: 'modules/proscenium/sounds/custom-unlock.ogg',
    open: 'modules/proscenium/sounds/custom-open.ogg',
    typing: 'modules/proscenium/sounds/custom-type.ogg'
  }
}
```

The `bulkhead` bank is derived from CC0 Freesound sources:

- `industrial-bulkhead-close.ogg`: [lezaarth, "Electric Door"](https://freesound.org/people/lezaarth/sounds/316092/), reversed from about 1.0s to 3.6s.
- `industrial-bulkhead-seal.ogg`: [SecureSubset, "Large Metal Bunker Doors, Opening and Closing, Resonances"](https://freesound.org/people/SecureSubset/sounds/845666/), cut from about 9.5s to 11.5s.
- `industrial-bulkhead-unlock.ogg`: [Velvorn, "sas_fermeture.WAV"](https://freesound.org/people/Velvorn/sounds/95772/), cut from the opening 1.55s.
- `industrial-bulkhead-open.ogg`: [lezaarth, "Electric Door"](https://freesound.org/people/lezaarth/sounds/316092/), cut from about 1.0s to 5.1s.

## Briefing Text

Briefings are used by both `transitionToScene` and `showTextOverlay`.

```js
briefing: {
  frame: 'mission-card',
  style: 'industrial',
  layout: {
    align: 'center',
    textAlign: 'start',
    maxWidth: '820px',
    offset: {
      x: '0',
      y: '0'
    }
  },
  animation: {
    type: 'typewriter',
    durationMs: 1600,
    lineDelayMs: 350
  },
  sender: {
    name: 'LT. VERA KAO',
    sublabel: 'Evergreen Command',
    image: 'worlds/my-world/assets/vera-kao.webp',
    imageFit: 'cover',
    position: 'left'
  },
  lines: [
    { text: 'MISSION 1: BUG HUNT', fontSize: '52px' },
    { text: 'COMBAT: TRAPDOOR SPIDER', fontSize: '38px' }
  ]
}
```

Available frames:

```js
'cinematic-bars'
'horizontal-bar'
'lower-third'
'panel'
'mission-card'
'chyron'
'none'
```

Available text animations:

```js
'typewriter'
'scroll'
'stagger-fade'
'decode'
'wipe'
'none'
```

The `scroll` animation is supported only by `chyron` and `horizontal-bar`.

### Senders

Briefings can include a sender block. It is designed for `mission-card`, `panel`, and `lower-third` frames.

Manual sender:

```js
sender: {
  name: 'LT. VERA KAO',
  label: 'TRANSMISSION SOURCE',
  sublabel: 'Evergreen Command',
  image: 'worlds/my-world/assets/vera-kao.webp',
  imageFit: 'cover',
  imageShape: 'portrait',
  position: 'left',
  size: 'normal'
}
```

Actor lookup by exact name:

```js
sender: {
  actor: {
    name: 'LT. VERA KAO',
    image: 'portrait'
  },
  sublabel: 'Evergreen Command',
  position: 'right',
  imageShape: 'circle',
  size: 'compact'
}
```

Actor lookup by UUID:

```js
sender: {
  actor: {
    uuid: 'Actor.abc123',
    image: 'token'
  },
  label: 'BLACK CHANNEL',
  sublabel: 'Encrypted Channel',
  position: 'top',
  imageShape: 'square',
  size: 'large'
}
```

When using `actor.name`, the name must match exactly one world actor. If multiple actors share the same name, use `actor.uuid`.

Sender options:

```js
sender: {
  label: 'TRANSMISSION SOURCE', // defaults to this value
  imageFit: 'cover',            // 'cover' or 'contain'
  imageShape: 'square',         // 'square', 'portrait', or 'circle'
  position: 'left',             // 'left', 'right', or 'top'
  size: 'normal'                // 'compact', 'normal', or 'large'
}
```

## Text Overlays

```js
const proscenium = game.modules.get('proscenium').api;

await proscenium.showTextOverlay({
  id: 'mission-alert',
  placement: {
    x: 'center',
    y: 'center'
  },
  durationMs: 8000,
  behavior: {
    clearExisting: true,
    closeAllWindows: false,
    blockInteractions: false
  },
  text: {
    frame: 'horizontal-bar',
    style: 'alert',
    layout: {
      align: 'center',
      textAlign: 'center'
    },
    animation: {
      type: 'wipe',
      durationMs: 850,
      lineDelayMs: 180
    },
    lines: [
      { text: 'WARNING: CONTAINMENT FAILURE', fontSize: '42px' },
      { text: 'EVACUATE NONESSENTIAL PERSONNEL', fontSize: '26px' }
    ]
  }
});
```

Chyron example:

```js
await proscenium.showTextOverlay({
  id: 'mission-chyron',
  placement: {
    x: 'center',
    y: 'center'
  },
  durationMs: 18000,
  behavior: {
    clearExisting: true
  },
  text: {
    frame: 'chyron',
    style: 'scanline',
    animation: {
      type: 'scroll',
      durationMs: 18000,
      loop: true,
      separator: ' // '
    },
    lines: [
      { text: 'MISSION UPDATE: HOSTILE CONTACTS DETECTED', fontSize: '24px' },
      { text: 'OBJECTIVE: SECURE THE LANDING ZONE', fontSize: '24px' },
      { text: 'WEATHER: EXTREME HUMIDITY', fontSize: '24px' }
    ]
  }
});
```

Typewriter text overlays play local typing clicks by default. The click sound is chosen from the text style. Use `audio.profile: 'silent'` to disable it or override the typing file directly.

```js
await proscenium.showTextOverlay({
  id: 'typing-audio-test',
  durationMs: 9000,
  behavior: {
    clearExisting: true,
    closeAllWindows: false,
    blockInteractions: false
  },
  audio: {
    profile: 'terminal',
    volume: {
      typing: 0.35
    }
  },
  text: {
    frame: 'panel',
    style: 'terminal',
    animation: {
      type: 'typewriter',
      durationMs: 1400,
      lineDelayMs: 260
    },
    lines: [
      { text: 'UPLINK ESTABLISHED', fontSize: '34px' },
      { text: 'STANDBY FOR TRANSMISSION', fontSize: '24px' }
    ]
  }
});
```

Comms message helper:

```js
const proscenium = game.modules.get('proscenium').api;

async function showCommsMessage({
  id = 'comms-message',
  actorName,
  actorUuid,
  sublabel = 'Secure Channel',
  lines,
  style = 'hologram',
  frame = 'lower-third'
}) {
  return proscenium.showTextOverlay({
    id,
    durationMs: 9000,
    behavior: {
      clearExisting: true,
      closeAllWindows: false,
      blockInteractions: false
    },
    text: {
      frame,
      style,
      layout: {
        align: 'start',
        textAlign: 'start',
        maxWidth: '760px'
      },
      sender: {
        actor: actorUuid
          ? { uuid: actorUuid, image: 'portrait' }
          : { name: actorName, image: 'portrait' },
        label: 'COMMS',
        sublabel,
        position: 'left',
        imageShape: 'circle',
        size: 'normal'
      },
      animation: {
        type: 'typewriter',
        durationMs: 1200,
        lineDelayMs: 250
      },
      lines
    }
  });
}

await showCommsMessage({
  actorName: 'LT. VERA KAO',
  sublabel: 'Evergreen Command',
  lines: [
    { text: 'MISSION UPDATE RECEIVED', fontSize: '34px' },
    { text: 'HOSTILE CONTACTS CONFIRMED', fontSize: '24px' }
  ]
});
```

## HTML Overlays

`showHtmlOverlay` renders arbitrary GM-provided HTML on every connected client. Use it only for trusted GM macros.

```js
await proscenium.showHtmlOverlay({
  id: 'warning',
  html: '<h1>Evacuate immediately</h1>',
  placement: {
    x: 'center',
    y: 'center'
  },
  durationMs: 0,
  behavior: {
    clearExisting: true
  }
});
```

## Closing Overlays

```js
await proscenium.closeOverlay('warning');
await proscenium.closeAllOverlays();
```

## Config Reference

```ts
type TransitionToSceneConfig = {
  scene: {
    name: string;
  };
  id?: string;
  preset?: 'bulkhead' | 'quick-alert' | 'silent-fade';
  transition?: {
    type?: 'split-door' | 'horizontal-shutter' | 'fade';
    style?: 'industrial' | 'terminal' | 'scanline' | 'alert' | 'hologram' | 'classified' | 'clean';
  };
  briefing?: BriefingConfig;
  audio?: {
    profile?: 'bulkhead'
      | 'classic-industrial'
      | 'heavy-industrial'
      | 'harsh-industrial'
      | 'terminal'
      | 'scanline'
      | 'alert'
      | 'hologram'
      | 'classified'
      | 'silent';
    volume?: {
      doors?: number;
      typing?: number;
    };
    overrides?: {
      close?: string;
      seal?: string;
      unlock?: string;
      open?: string;
      typing?: string;
    };
  };
  timeline?: {
    closeMs?: number;
    briefingMs?: number;
    unlockMs?: number;
    openMs?: number;
    fadeOutMs?: number;
    fadeInMs?: number;
    textFadeMs?: number;
    sceneReadyTimeoutMs?: number;
  };
  behavior?: {
    aboveUi?: boolean;
    blockInteractions?: boolean;
    escape?: 'skip-local';
  };
};

type BriefingConfig = {
  frame?: 'cinematic-bars' | 'horizontal-bar' | 'lower-third' | 'panel' | 'mission-card' | 'chyron' | 'none';
  style?: 'industrial' | 'terminal' | 'scanline' | 'alert' | 'hologram' | 'classified' | 'clean';
  layout?: {
    align?: 'start' | 'center' | 'end';
    textAlign?: 'start' | 'center' | 'end';
    maxWidth?: string;
    offset?: {
      x?: string;
      y?: string;
    };
  };
  animation?: {
    type?: 'typewriter' | 'scroll' | 'stagger-fade' | 'decode' | 'wipe' | 'none';
    durationMs?: number;
    lineDelayMs?: number;
    loop?: boolean;
    separator?: string;
  };
  sender?: {
    name?: string;
    label?: string;
    sublabel?: string;
    image?: string;
    imageFit?: 'cover' | 'contain';
    imageShape?: 'square' | 'portrait' | 'circle';
    position?: 'left' | 'right' | 'top';
    size?: 'compact' | 'normal' | 'large';
    actor?: {
      uuid?: string;
      name?: string;
      image?: 'portrait' | 'token';
    };
  };
  lines: Array<{
    text: string;
    fontSize?: string;
  }>;
  glitch?: {
    cycleMs: number;
  } | false;
};

type ShowTextOverlayConfig = {
  id?: string;
  text: BriefingConfig;
  placement?: {
    x?: 'start' | 'center' | 'end';
    y?: 'start' | 'center' | 'end';
  };
  durationMs?: number;
  behavior?: {
    clearExisting?: boolean;
    closeAllWindows?: boolean;
    aboveUi?: boolean;
    blockInteractions?: boolean;
    fadeOnClose?: boolean;
  };
  audio?: {
    profile?: 'bulkhead'
      | 'classic-industrial'
      | 'heavy-industrial'
      | 'harsh-industrial'
      | 'terminal'
      | 'scanline'
      | 'alert'
      | 'hologram'
      | 'classified'
      | 'silent';
    volume?: {
      typing?: number;
    };
    overrides?: {
      typing?: string;
    };
  };
};

type ShowHtmlOverlayConfig = {
  id?: string;
  html: string;
  placement?: {
    x?: 'start' | 'center' | 'end';
    y?: 'start' | 'center' | 'end';
  };
  durationMs?: number;
  behavior?: {
    clearExisting?: boolean;
    closeAllWindows?: boolean;
    aboveUi?: boolean;
    blockInteractions?: boolean;
    fadeOnClose?: boolean;
  };
};
```

## Security

`showHtmlOverlay` renders arbitrary GM-provided HTML for every connected client. Only trusted GM macros should call it. Do not pass unsanitized player-provided content into `showHtmlOverlay`.
