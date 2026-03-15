/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID: string
    readonly VITE_GOOGLE_API_KEY: string
    // add other variables here...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }