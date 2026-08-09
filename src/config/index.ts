import path from 'path';
import dotenv from 'dotenv';
import { buildDatabaseUrlFromEnv } from './databaseUrl';

type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

const selectedEnvFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const projectRoot = path.resolve(__dirname, '..', '..');
const envPath = path.resolve(projectRoot, selectedEnvFile);
dotenv.config({ path: envPath });

const constructDatabaseUrl = (db: DatabaseConfig): string => {
  return `mysql://${encodeURIComponent(db.user)}:${encodeURIComponent(db.password || '')}@${db.host}:${db.port}/${encodeURIComponent(db.database)}`;
};

if (!process.env.DATABASE_URL) {
  const resolvedDatabaseUrl = buildDatabaseUrlFromEnv(process.env);
  if (resolvedDatabaseUrl) {
    process.env.DATABASE_URL = resolvedDatabaseUrl;
  }
}

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

const defaultSslKeyPath = '/etc/letsencrypt/live/delta-api.cerbon.id/privkey.pem';
const defaultSslCertPath = '/etc/letsencrypt/live/delta-api.cerbon.id/fullchain.pem';
const defaultSslCaPath = '/etc/letsencrypt/live/delta-api.cerbon.id/chain.pem';

const sslKeyPath = process.env.SSL_KEY_PATH?.trim() || (environment === 'production' ? defaultSslKeyPath : undefined);
const sslCertPath = process.env.SSL_CERT_PATH?.trim() || (environment === 'production' ? defaultSslCertPath : undefined);
const sslCaPath = process.env.SSL_CA_PATH?.trim() || (environment === 'production' ? defaultSslCaPath : undefined);

export const config = {
  environment,
  nodeEnv,
  isProduction: environment === 'production',
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  sslKeyPath,
  sslCertPath,
  sslCaPath,
  useHttps: environment === 'production' && Boolean(sslKeyPath && sslCertPath),
  db: dbFromUrl || {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'delta_kebab_db'
  }
};
