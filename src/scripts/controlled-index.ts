import fs from 'fs/promises';
import { config } from '../config.js';
import { WordPressService } from '../services/wordpress.js';
import { ContentProcessor } from '../services/processor.js';
import { PineconeService } from '../services/pinecone.js';

const BATCH_SIZE = 5; // For initial testing
const CHECKPOINT_FILE = 'indexing-checkpoint.json';

interface Checkpoint {
  processedIds: string[];
  totalProcessed: number;
  batchNumber: number;
}

async function loadCheckpoint(): Promise<Checkpoint> {
  try {
    const data = await fs.readFile(CHECKPOINT_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { processedIds: [], totalProcessed: 0, batchNumber: 1 };
  }
}

async function saveCheckpoint(checkpoint: Checkpoint) {
  await fs.writeFile(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

async function indexReviewsBatch() {
  try {
    const wordpress = new WordPressService(config.WORDPRESS_URL);
    const processor = new ContentProcessor(config.OPENAI_API_KEY);
    const pinecone = new PineconeService(
      config.PINECONE_API_KEY,
      config.PINECONE_ENVIRONMENT,
      config.PINECONE_INDEX_NAME
    );

    const checkpoint = await loadCheckpoint();
    let { processedIds, totalProcessed, batchNumber } = checkpoint;
    const startTime = Date.now();

    console.log(`Starting batch ${batchNumber} (${totalProcessed} reviews processed so far)`);

    const reviews = await wordpress.fetchRecentReviews(BATCH_SIZE);

    // Filter out already processed reviews
    const newReviews = reviews.filter(review => !processedIds.includes(review.id));
    
    if (newReviews.length === 0) {
      console.log('No new reviews to process');
      return;
    }

    for (const review of newReviews) {
      const chunks = processor.createChunks(review);
      const embeddings = await processor.createEmbeddings(chunks);
      await pinecone.upsertVectors(chunks, embeddings);
      
      totalProcessed++;
      processedIds.push(review.id);

      // Save progress
      await saveCheckpoint({ processedIds, totalProcessed, batchNumber });

      // Log detailed information for the first 5 reviews
      console.log('\nProcessing review:');
      console.log(`ID: ${review.id}`);
      console.log(`Title: ${review.metadata.title}`);
      console.log(`Book: ${review.metadata.bookTitle}`);
      console.log(`Author: ${review.metadata.authorName}`);
      console.log(`Grade: ${review.metadata.grade}`);
      console.log(`Sensuality: ${review.metadata.sensuality}`);
      console.log(`Book Types: ${review.metadata.bookTypes.join(', ')}`);
      console.log(`Review Tags: ${review.metadata.reviewTags.join(', ')}`);
      console.log(`Amazon URL: ${review.metadata.amazonUrl}`);
      console.log(`ASIN: ${review.metadata.asin}`);
      console.log(`Comments: ${review.metadata.comments.count}`);
      console.log(`Review Date: ${review.metadata.postDate}`);
      console.log('\nFirst chunk of content:');
      console.log(chunks[0].text.substring(0, 200) + '...');

      const elapsedMinutes = (Date.now() - startTime) / 60000;
      const rate = totalProcessed / elapsedMinutes;
      
      console.log(`\n✓ Indexed: ${review.metadata.bookTitle}`);
      console.log(`  Rate: ${rate.toFixed(2)} reviews/minute`);
    }

    console.log(`\nBatch ${batchNumber} completed:`);
    console.log(`- Processed in this batch: ${newReviews.length}`);
    console.log(`- Total processed overall: ${totalProcessed}`);
    console.log(`\nTo process the next batch, run: npm run index-batch`);
    
    await saveCheckpoint({
      processedIds,
      totalProcessed,
      batchNumber: batchNumber + 1
    });

  } catch (error) {
    console.error('Indexing failed:', error);
    process.exit(1);
  }
}

indexReviewsBatch();