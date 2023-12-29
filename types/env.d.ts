declare global {
  namespace NodeJS {
    interface ProcessEnv {
      URL_LOGIN: string;
      PASSWORD: string;
      BROWSER_MODE: 'head' | 'headless';
    }
  }
}
export {};
