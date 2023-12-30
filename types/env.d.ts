declare global {
  namespace NodeJS {
    interface ProcessEnv {
      URL_LOGIN: string;
      PASSWORD: string;
      DB_URL: string;
      BROWSER_MODE: 'head' | 'headless';
    }
  }
}
export {};
