// src/scripts/test-custom.ts
import dotenv from 'dotenv';
import { ContentProcessor } from '../services/processor.js';
import { PineconeService } from '../services/pinecone.js';
import { config } from '../config.js';

async function testCustomQuery(query: string) {
  const processor = new ContentProcessor(config.OPENAI_API_KEY);
  const pinecone = new PineconeService(
    config.PINECONE_API_KEY,
    config.PINECONE_ENVIRONMENT,
    config.PINECONE_INDEX_NAME
  );

  console.log(`\nQuery: "${query}"`);
  console.log('-'.repeat(query.length + 4));

  try {
    const embeddings = await processor.createEmbeddings([{ text: query, metadata: {} }]);
    const results = await pinecone.query(embeddings[0], 3);

    console.log('\nTop Matches:');
    results?.forEach((match, i) => {
      if (match.metadata) {
        console.log(`\n${i + 1}. Book: ${match.metadata.bookTitle}`);
        console.log(`   Author: ${match.metadata.authorName}`);
        console.log(`   Grade: ${match.metadata.grade}`);
        console.log(`   Sensuality: ${match.metadata.sensuality}`);
        console.log(`   Types: ${Array.isArray(match.metadata.bookTypes) ? match.metadata.bookTypes.join(', ') : 'N/A'}`);
        console.log(`   Match Score: ${(match.score! * 100).toFixed(1)}%`);
        if (match.metadata.chunkType === 'review') {
          if (typeof match.metadata.text === 'string') {
            console.log(`   Excerpt: ${match.metadata.text.slice(0, 200)}...`);
          }
        }
      }
    });
  } catch (error) {
    console.error('Query failed:', error);
  }
}

// Test queries that match our indexed content
const queries = [
  "Tell me about A Friend in the Glass by Gregory Ashe",
  "Show me reviews by Caz Owens",
  "What are some good mystery books with LGBT characters?",
  "Find books rated B+ or higher",
  "What did readers think about The Jewel of the Isle?"
];

async function runTests() {
  for (const query of queries) {
    await testCustomQuery(query);
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

runTests();