# Proscenium Test Macros

These macros are intended for manual verification in a Foundry world with Proscenium and socketlib enabled.

Replace `Sandbox` with the exact scene name you want to reveal. Actor-name examples require an actor with that exact name.

## Bulkhead Transition

Verifies split-door animation, scene activation, door sounds, and typewriter clicks.

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

await proscenium.transitionToScene({
  id: 'test-bulkhead-transition',
  scene: { name: 'Sandbox' },
  preset: 'bulkhead',
  transition: {
    type: 'split-door',
    style: 'industrial'
  },
  audio: {
    profile: 'bulkhead',
    volume: {
      doors: 0.85,
      typing: 0.35
    }
  },
  briefing: {
    frame: 'mission-card',
    style: 'hologram',
    layout: {
      align: 'center',
      textAlign: 'center',
      maxWidth: '860px'
    },
    animation: {
      type: 'typewriter',
      durationMs: 1600,
      lineDelayMs: 350
    },
    lines: [
      { text: 'MISSION 1: BUG HUNT', fontSize: '52px' },
      { text: 'COMBAT: TRAPDOOR SPIDER', fontSize: '38px' },
      { text: 'OBJECTIVE: SEARCH AND DESTROY', fontSize: '34px' },
      { text: 'EARLY SPRING, 5014U | HERCYNIA', fontSize: '20px' }
    ]
  }
});
```

## Silent Fade Transition

Verifies fade transition timing and silent audio profile.

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

await proscenium.transitionToScene({
  id: 'test-silent-fade-transition',
  scene: { name: 'Sandbox' },
  preset: 'silent-fade',
  transition: {
    type: 'fade',
    style: 'clean'
  },
  briefing: {
    frame: 'panel',
    style: 'clean',
    layout: {
      align: 'center',
      textAlign: 'center',
      maxWidth: '720px'
    },
    animation: {
      type: 'stagger-fade',
      durationMs: 900,
      lineDelayMs: 180
    },
    lines: [
      { text: 'ENTERING NEW AREA', fontSize: '40px' },
      { text: 'LOCAL CONDITIONS UNKNOWN', fontSize: '24px' }
    ]
  }
});
```

## Quick Alert Shutter

Verifies horizontal shutter transition, alert styling, and bundled alert sounds.

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

await proscenium.transitionToScene({
  id: 'test-alert-shutter-transition',
  scene: { name: 'Sandbox' },
  preset: 'quick-alert',
  transition: {
    type: 'horizontal-shutter',
    style: 'alert'
  },
  briefing: {
    frame: 'horizontal-bar',
    style: 'alert',
    layout: {
      align: 'center',
      textAlign: 'center'
    },
    animation: {
      type: 'wipe',
      durationMs: 750,
      lineDelayMs: 150
    },
    lines: [
      { text: 'WARNING: HOSTILE CONTACT', fontSize: '42px' },
      { text: 'BRACE FOR DEPLOYMENT', fontSize: '24px' }
    ]
  }
});
```

## Lower-Third Sender Overlay

Verifies lower-third layout, manual sender image, and default typewriter clicks.

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

await proscenium.showTextOverlay({
  id: 'test-lower-third-sender',
  placement: {
    x: 'start',
    y: 'end'
  },
  durationMs: 10000,
  behavior: {
    clearExisting: true,
    closeAllWindows: false,
    blockInteractions: false
  },
  text: {
    frame: 'lower-third',
    style: 'hologram',
    layout: {
      align: 'start',
      textAlign: 'start',
      maxWidth: '780px',
      offset: {
        x: '28px',
        y: '-48px'
      }
    },
    sender: {
      name: 'LT. VERA KAO',
      label: 'COMMS',
      sublabel: 'Secure Channel',
      image: 'icons/svg/mystery-man.svg',
      imageShape: 'circle',
      position: 'left',
      size: 'normal'
    },
    animation: {
      type: 'typewriter',
      durationMs: 1200,
      lineDelayMs: 250
    },
    lines: [
      { text: 'MISSION UPDATE RECEIVED', fontSize: '34px' },
      { text: 'HOSTILE CONTACTS CONFIRMED', fontSize: '24px' }
    ]
  }
});
```

## Actor Sender Lookup

Verifies actor-name lookup, actor portrait use, duplicate-name errors, and sender layout.

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

await proscenium.showTextOverlay({
  id: 'test-actor-sender',
  durationMs: 10000,
  behavior: {
    clearExisting: true,
    closeAllWindows: false,
    blockInteractions: false
  },
  text: {
    frame: 'mission-card',
    style: 'classified',
    layout: {
      align: 'center',
      textAlign: 'start',
      maxWidth: '820px'
    },
    sender: {
      actor: {
        name: 'Exact Actor Name Here',
        image: 'portrait'
      },
      label: 'BLACK CHANNEL',
      sublabel: 'Encrypted Source',
      imageShape: 'portrait',
      position: 'left',
      size: 'large'
    },
    animation: {
      type: 'typewriter',
      durationMs: 1500,
      lineDelayMs: 260
    },
    lines: [
      { text: 'AUTHENTICATED SIGNAL RECEIVED', fontSize: '34px' },
      { text: 'SOURCE IDENTITY CONFIRMED', fontSize: '24px' }
    ]
  }
});
```

## Chyron Overlay

Verifies scrolling text, scanline style, and non-blocking overlay behavior.

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

await proscenium.showTextOverlay({
  id: 'test-chyron',
  placement: {
    x: 'center',
    y: 'end'
  },
  durationMs: 18000,
  behavior: {
    clearExisting: true,
    closeAllWindows: false,
    blockInteractions: false
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

## Typing Audio Overlay

Verifies explicit text-overlay audio profile and typing volume.

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

await proscenium.showTextOverlay({
  id: 'test-typing-audio',
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

## Sound Profile Sweep

Verifies transition sound profiles without changing the visual style. Change `profile` and rerun.

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

const profile = 'harsh-industrial';

await proscenium.transitionToScene({
  id: `test-sound-profile-${profile}`,
  scene: { name: 'Sandbox' },
  transition: {
    type: 'split-door',
    style: 'industrial'
  },
  audio: {
    profile,
    volume: {
      doors: 0.85,
      typing: 0.35
    }
  },
  briefing: {
    frame: 'panel',
    style: 'industrial',
    layout: {
      align: 'center',
      textAlign: 'center',
      maxWidth: '720px'
    },
    animation: {
      type: 'typewriter',
      durationMs: 900,
      lineDelayMs: 160
    },
    lines: [
      { text: `SOUND PROFILE: ${profile.toUpperCase()}`, fontSize: '32px' }
    ]
  }
});
```

Available profiles:

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

## Error Handling Checks

Invalid scene name:

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

await proscenium.transitionToScene({
  scene: { name: 'Definitely Not A Real Scene' },
  briefing: {
    lines: [
      { text: 'THIS SHOULD NOT RENDER' }
    ]
  }
});
```

Invalid actor name:

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

await proscenium.showTextOverlay({
  text: {
    sender: {
      actor: {
        name: 'Definitely Not A Real Actor'
      }
    },
    lines: [
      { text: 'THIS SHOULD NOT RENDER' }
    ]
  }
});
```

## Cleanup

Closes all active Proscenium overlays.

```js
const proscenium = game.modules.get('proscenium')?.api;
if (!proscenium) throw new Error('Proscenium API not found.');

await proscenium.closeAllOverlays();
```
