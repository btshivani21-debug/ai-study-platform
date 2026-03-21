import dotenv from 'dotenv';
dotenv.config({ override: false });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};
