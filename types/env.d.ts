declare global {
  namespace NodeJS {
    interface ProcessEnv {
      URL_LOGIN: string;
      URL_CART: string;
      URL_QUERY: string;
      URL_MEMBERSHIP: string;
      PASSWORD: string;
      DB_URL: string;
      BROWSER_MODE: 'head' | 'headless';
      NODE_ENV: 'dev' | 'prod';
      CHROME_PATH?: string;
    }
  }
}
export {};
