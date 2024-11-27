import fs from 'fs/promises';
import { config } from '../config.js';
import { WordPressService } from '../services/wordpress.js';
import { ContentProcessor } from '../services/processor.js';
import { PineconeService } from '../services/pinecone.js';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
const CHECKPOINT_FILE = 'indexing-checkpoint.json';

interface Checkpoint {
  cursor: string | null;
  totalProcessed: number;
  lastProcessedId?: string;
}

async function loadCheckpoint(): Promise<Checkpoint> {
  try {
    const data = await fs.readFile(CHECKPOINT_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { cursor: null, totalProcessed: 0 };
  }
}

async function saveCheckpoint(checkpoint: Checkpoint) {
  await fs.writeFile(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

async function indexReviews() {
  try {
    console.log('Starting indexing with batch size:', BATCH_SIZE);

    const wordpress = new WordPressService(config.WORDPRESS_URL);
    const processor = new ContentProcessor(config.OPENAI_API_KEY);
    const pinecone = new PineconeService(
      config.PINECONE_API_KEY,
      config.PINECONE_ENVIRONMENT,
      config.PINECONE_INDEX_NAME
    );

    // Verify index exists
    const exists = await pinecone.verifyIndex();
    if (!exists) {
      throw new Error('Pinecone index does not exist. Run create-index first.');
    }

    // Load checkpoint if exists
    const checkpoint = await loadCheckpoint();
    let { cursor, totalProcessed } = checkpoint;
    let errors = 0;
    const startTime = Date.now();

    console.log('Fetching and processing reviews...');
    if (cursor) {
      console.log(`Resuming from checkpoint. Previously processed: ${totalProcessed}`);
    }

    while (true) {
      try {
        const { reviews, nextCursor } = await wordpress.fetchRecentReviews(cursor, BATCH_SIZE);
        if (reviews.length === 0) break;

        console.log(`\nProcessing batch of ${reviews.length} reviews`);

        for (const review of reviews) {
          try {
            const chunks = processor.createChunks(review);
            const embeddings = await processor.createEmbeddings(chunks);
            await pinecone.upsertVectors(chunks, embeddings);
            
            totalProcessed++;
            
            // Save checkpoint after each review
            await saveCheckpoint({ 
              cursor: nextCursor, 
              totalProcessed,
              lastProcessedId: review.id 
            });

            const elapsedMinutes = (Date.now() - startTime) / 60000;
            const rate = totalProcessed / elapsedMinutes;
            
            console.log(
              `✓ Indexed: ${review.metadata.bookTitle} ` +
              `(${totalProcessed} total, ${rate.toFixed(2)} reviews/minute)`
            );
          } catch (error) {
            errors++;
            console.error(`✗ Failed: ${review.metadata.bookTitle}`, error);
          }
        }

        if (!nextCursor) break;
        cursor = nextCursor;

      } catch (error) {
        console.error('Batch processing failed:', error);
        errors++;
        if (errors > 5) {
          throw new Error('Too many errors, stopping process');
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('\nIndexing completed:');
    console.log(`- Total processed: ${totalProcessed}`);
    console.log(`- Errors: ${errors}`);
    
    // Clear checkpoint file after successful completion
    await fs.unlink(CHECKPOINT_FILE).catch(() => {});
    
  } catch (error) {
    console.error('Indexing failed:', error);
    process.exit(1);
  }
}

indexReviews();