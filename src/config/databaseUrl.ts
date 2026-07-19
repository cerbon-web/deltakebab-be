export type DatabaseEnv = {
  DB_HOST?: string;
  DB_PORT?: string;
  DB_USER?: string;
  DB_NAME?: string;
  DB_PASSWORD?: string;
  DATABASE_URL?: string;
};

export const buildDatabaseUrlFromEnv = (env: DatabaseEnv): string | undefined => {
  if (env.DB_HOST && env.DB_USER && env.DB_NAME) {
    const host = env.DB_HOST;
    const port = env.DB_PORT || '3306';
    const user = encodeURIComponent(env.DB_USER);
    const password = encodeURIComponent(env.DB_PASSWORD || '');
    const database = encodeURIComponent(env.DB_NAME);
    return `mysql://${user}:${password}@${host}:${port}/${database}`;
  }

  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  return undefined;
};
