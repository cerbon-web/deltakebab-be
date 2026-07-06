import path from 'path';
import dotenv from 'dotenv';

type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

const selectedEnvFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(process.cwd(), selectedEnvFile);
dotenv.config({ path: envPath });

const parseDatabaseUrl = (url?: string): DatabaseConfig | null => {
  if (!url) return null;

  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: Number(u.port || 3306),
      user: u.username,
      password: u.password,
      database: u.pathname.replace(/^\//, '')
    };
  } catch {
    return null;
  }
};

const dbFromUrl = parseDatabaseUrl(process.env.DATABASE_URL);
const nodeEnv = (process.env.NODE_ENV || 'local').toLowerCase();
const environment = nodeEnv === 'production' ? 'production' : 'local';

export const config = {
  environment,
  nodeEnv,
  isProduction: environment === 'production',
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  sslKeyPath: process.env.SSL_KEY_PATH,
  sslCertPath: process.env.SSL_CERT_PATH,
  sslCaPath: process.env.SSL_CA_PATH,
  useHttps: environment === 'production' && Boolean(process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH),
  db: dbFromUrl || {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'delta_kebab_db'
  }
};
