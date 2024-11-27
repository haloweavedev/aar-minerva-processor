// src/scripts/create-index.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config.js';

async function createIndex() {
  const pinecone = new Pinecone({
    apiKey: config.PINECONE_API_KEY,
  });

  try {
    await pinecone.createIndex({
      name: config.PINECONE_INDEX_NAME,
      dimension: 1536,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    console.log('Index created successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('Index already exists, proceeding with indexing...');
    } else {
      console.error('Error creating index:', error);
      // Log more details about the error
      console.log('Error details:', JSON.stringify(error, null, 2));
    }
  }
}

createIndex();