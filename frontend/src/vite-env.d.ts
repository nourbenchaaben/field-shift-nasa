/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XAI_API_KEY?: string;
  readonly VITE_XAI_MODEL?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_TADAWOL_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
