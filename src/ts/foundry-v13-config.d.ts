import type { ProsceniumModule } from './types';

declare global {
  interface ModuleConfig {
    'proscenium': ProsceniumModule;
  }

  interface RequiredModules {
    'proscenium': true;
  }
}

export {};
