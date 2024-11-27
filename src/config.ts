// src/config.ts
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  WORDPRESS_URL: process.env.WORDPRESS_URL ?? 'https://allaboutromance.com',
  OPENAI_API_KEY: requireEnv('OPENAI_API_KEY'),
  PINECONE_API_KEY: requireEnv('PINECONE_API_KEY'),
  PINECONE_ENVIRONMENT: requireEnv('PINECONE_ENVIRONMENT'),
  PINECONE_INDEX_NAME: requireEnv('PINECONE_INDEX_NAME')
} as const;

export type Config = typeof config;