# Project Minerva Documentation

## Overview
Project Minerva is a Retrieval-Augmented Generation (RAG) system designed to create an intelligent chatbot for All About Romance (allaboutromance.com). The system consists of two main components:
1. **Minerva Processor**: A data processing and indexing system
2. **Minerva Chatbot**: A Next.js-based chatbot interface (separate repository)

## Minerva Processor

### Purpose
The processor handles:
- Fetching book reviews from WordPress via GraphQL
- Processing review content and metadata
- Creating embeddings using OpenAI
- Storing vectors in Pinecone for efficient retrieval

### Current Implementation Status

#### Data Sources
- WordPress GraphQL endpoint: `https://allaboutromance.com/graphql`
- Custom post type: `book-review`
- Total reviews to process: 18,139

#### Data Structure
Each review contains:
```typescript
{
  id: string;
  content: string;
  date: string;
  metadata: {
    postId: string;
    title: string;
    bookTitle: string;
    authorName: string;
    reviewerName: string;
    url: string;
    amazonUrl: string;
    asin: string;
    featuredImage: string;
    grade: string;
    sensuality: string;
    publishDate: string;
    postDate: string;
    bookTypes: string[];
    reviewTags: string[];
    comments: {
      count: number;
      latest: Comment[];
    }
  }
}
```

### Key Files and Their Purposes

1. `src/services/wordpress.ts`
   - Handles GraphQL queries to WordPress
   - Processes raw review data
   - Edit this to modify data fetching logic or add new fields

2. `src/services/processor.ts`
   - Creates chunks from review content
   - Generates embeddings via OpenAI
   - Edit this to modify how content is split and processed
   - Key to Question Answering capabilities

3. `src/services/pinecone.ts`
   - Manages Pinecone vector database operations
   - Handles vector storage and retrieval
   - Edit this to modify how vectors are stored/queried

4. `src/scripts/controlled-index.ts`
   - Main indexing script
   - Manages batched processing
   - Edit BATCH_SIZE here (currently 5)
   - Controls checkpointing and progress tracking

### Configuration Settings

#### Batch Size Control
To modify batch sizes, edit these files:
```typescript
// src/scripts/controlled-index.ts
const BATCH_SIZE = 5; // Change this number

// src/scripts/index-reviews.ts
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
```

#### Environment Variables
Required in `.env`:
```bash
OPENAI_API_KEY=your-key
PINECONE_API_KEY=your-key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=aar
WORDPRESS_URL=https://allaboutromance.com
```

### Current Chunking Strategy
Reviews are currently split into these chunks:
1. Main review content
2. Comments/discussion
3. Book metadata
4. Review metadata

### Enhancing Question Answering

To improve QA capabilities, modify these components:

1. `src/services/processor.ts`:
   ```typescript
   createChunks(review: ProcessedReview) {
     // Add new chunk types for specific question types
     // Example: Plot summaries, character details, similar books
   }
   ```

2. `src/services/pinecone.ts`:
   ```typescript
   async query(vector: number[], filters?: any) {
     // Add metadata filtering
     // Enhance similarity search
   }
   ```

### Running the Processor

1. Create/verify index:
   ```bash
   npm run create-index
   ```

2. Process reviews in batches:
   ```bash
   npm run index-batch
   ```

3. Test queries:
   ```bash
   npm run test-custom
   ```

### Next Steps

1. **Enhance Chunking Strategy**
   - Add plot-specific chunks
   - Create character-focused chunks
   - Implement recommendation context

2. **Improve Metadata**
   - Add relationship data between books
   - Enhanced genre and theme mapping
   - Better author information tracking

3. **Chatbot Integration**
   - Implement vector retrieval strategies
   - Design conversation flows
   - Create response templates

### Testing Current Capabilities

Current test queries available:
```typescript
const TEST_QUERIES = [
  "What are some highly rated romance books from late 2024?",
  "Show me reviews of books with 'subtle' sensuality rating",
  "What did readers think about mystery books?",
  "Find books with A or A- grades",
  "Show me book reviews by specific reviewers"
];
```

### Quality Metrics

Current indexing processes:
- Tracks reviews/minute
- Verifies data completeness
- Monitors embedding quality
- Checks for duplicate prevention

## Contributing

To add new capabilities:

1. Add new chunk types in `processor.ts`
2. Update test queries in `test-custom.ts`
3. Verify embeddings quality
4. Test with sample queries
5. Document new features

## Notes for Future Development

Planned enhancements:
1. Series tracking
2. Author relationship mapping
3. Theme extraction
4. Sentiment analysis of reviews
5. Enhanced similar book recommendations

Remember to test thoroughly after any modifications to ensure data quality and retrieval accuracy.