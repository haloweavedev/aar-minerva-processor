import dotenv from 'dotenv';
import { WordPressService } from './services/wordpress.js';
import { ContentProcessor } from './services/processor.js';
import { PineconeService } from './services/pinecone.js';

// Load environment variables
dotenv.config();

const BATCH_SIZE = 5;

async function processReviews() {
  try {
    const wordpress = new WordPressService(process.env.WORDPRESS_URL!);
    const processor = new ContentProcessor(process.env.OPENAI_API_KEY!);
    const pinecone = new PineconeService(
      process.env.PINECONE_API_KEY!,
      process.env.PINECONE_ENVIRONMENT!,
      process.env.PINECONE_INDEX_NAME!
    );

    console.log('Starting book review processing...');

    let page = 1;
    let totalProcessed = 0;

    while (true) {
      console.log(`Fetching page ${page} of reviews...`);
      const reviews = await wordpress.fetchRecentReviews(page, BATCH_SIZE);
      
      if (reviews.length === 0) break;

      for (const review of reviews) {
        console.log(`Processing review: ${review.metadata.title}`);
        
        try {
          const chunks = processor.createChunks(review);
          const embeddings = await processor.createEmbeddings(chunks);
          await pinecone.upsertVectors(chunks, embeddings);
          
          totalProcessed++;
          console.log(`Successfully processed review ${totalProcessed}`);
        } catch (error) {
          console.error(`Error processing review ${review.metadata.postId}:`, error);
          continue;
        }
      }

      page++;
    }

    console.log(`Processing completed. Total reviews processed: ${totalProcessed}`);
  } catch (error) {
    console.error('Error in main process:', error);
    throw error;
  }
}

async function testQuery(question: string) {
  try {
    const processor = new ContentProcessor(process.env.OPENAI_API_KEY!);
    const pinecone = new PineconeService(
      process.env.PINECONE_API_KEY!,
      process.env.PINECONE_ENVIRONMENT!,
      process.env.PINECONE_INDEX_NAME!
    );

    const embeddings = await processor.createEmbeddings([{ text: question, metadata: {} }]);
    const results = await pinecone.query(embeddings[0]);
    
    console.log('Query Results:');
    results?.forEach((match, i) => {
      if (match.metadata) {
        console.log(`\nMatch ${i + 1} (Score: ${match.score}):`);
        console.log('Book:', match.metadata.bookTitle);
        console.log('Author:', match.metadata.authorName);
        console.log('Grade:', match.metadata.grade);
        if (typeof match.metadata.text === 'string') {
          console.log('Content:', match.metadata.text.slice(0, 200) + '...');
        } else {
          console.log('Content is not a string.');
        }
      }
    });
  } catch (error) {
    console.error('Error in test query:', error);
  }
}

if (require.main === module) {
  processReviews().then(() => {
    return testQuery("What are some highly rated historical romance books with good reader reviews?");
  });
}

export { processReviews, testQuery };