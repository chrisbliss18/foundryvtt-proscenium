import type { AnarchistOverlayModule } from './types';

declare global {
  interface ModuleConfig {
    'anarchist-overlay': AnarchistOverlayModule;
  }

  interface RequiredModules {
    'anarchist-overlay': true;
  }
}

export {};
