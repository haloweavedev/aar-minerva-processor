// src/scripts/check-index.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config.js';

async function checkIndex() {
  const pinecone = new Pinecone({
    apiKey: config.PINECONE_API_KEY,
  });

  try {
    const indexList = await pinecone.listIndexes();
    const indexes = indexList.indexes || [];
    
    const index = indexes.find(idx => idx.name === config.PINECONE_INDEX_NAME);
    
    if (index) {
      console.log('Index found:', {
        name: index.name,
        dimension: index.dimension,
        metric: index.metric,
        status: index.status
      });
    } else {
      console.log('Index not found');
    }
  } catch (error) {
    console.error('Error checking index:', error);
  }
}

checkIndex();