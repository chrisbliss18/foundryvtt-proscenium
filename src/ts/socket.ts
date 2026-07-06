import {moduleId} from "./constants";
import type {Socketlib} from "./types";

export const setupSocket = () => {
  const socketlib = (globalThis as unknown as { socketlib?: Socketlib }).socketlib;
  if (!socketlib) {
    throw new Error(`Unable to initialize ${moduleId}: socketlib is not available.`);
  }

  return socketlib.registerModule(moduleId);
}
