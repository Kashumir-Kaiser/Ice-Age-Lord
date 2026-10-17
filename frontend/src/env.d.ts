interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_ENABLE_DEMO?: string;
  readonly VITE_GAME_MODE?: 'demo' | 'live';
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
