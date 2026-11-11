/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** true when public/models/avatar.glb exists at build time (astro.config.mjs). */
  readonly HAS_AVATAR: boolean;
}
