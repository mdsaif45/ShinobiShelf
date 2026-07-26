export interface EnvConfig {
  port: number;
  nodeEnv: string;
  dbProvider: 'firebase' | 'drizzle' | 'sqlite';
  sqlHost?: string;
  sqlUser?: string;
  sqlPassword?: string;
  sqlDbName?: string;
}

export const envConfig: EnvConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbProvider: (process.env.DB_PROVIDER as any) || 'sqlite',
  sqlHost: process.env.SQL_HOST,
  sqlUser: process.env.SQL_USER,
  sqlPassword: process.env.SQL_PASSWORD,
  sqlDbName: process.env.SQL_DB_NAME,
};
