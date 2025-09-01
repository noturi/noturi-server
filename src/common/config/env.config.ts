export interface EnvConfig {
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DATABASE_URL: string;
}

export const getEnvConfig = (): EnvConfig => {
  const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  // 필수 환경변수 검증
  const requiredVars = ['JWT_SECRET', 'GOOGLE_CLIENT_ID', 'DATABASE_URL'] as const;

  for (const varName of requiredVars) {
    if (!config[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  return config as EnvConfig;
};
