// src/test-rag.ts
import dotenv from 'dotenv';
import { ContentProcessor } from './services/processor.js';
import { PineconeService } from './services/pinecone.js';

dotenv.config();

const TEST_QUERIES = [
    "What are some highly rated romance books from late 2024?",
    "Show me reviews of books with 'subtle' sensuality rating",
    "What did readers think about mystery books?",
    "Find books with A or A- grades that have moose in them",
    "Show me book reviews by Caz Owens",
    "What are some good romantic suspense books?"
];

async function testRagQueries() {
    const processor = new ContentProcessor(process.env.OPENAI_API_KEY!);
    const pinecone = new PineconeService(
        process.env.PINECONE_API_KEY!,
        process.env.PINECONE_ENVIRONMENT!,
        process.env.PINECONE_INDEX_NAME!
    );

    console.log('Testing RAG Queries...\n');

    for (const query of TEST_QUERIES) {
        console.log(`\nQuery: "${query}"`);
        console.log('-------------------');

        try {
            const embeddings = await processor.createEmbeddings([{ text: query, metadata: {} }]);
            const results = await pinecone.query(embeddings[0], 3);

            console.log('Top Matches:');
            results?.forEach((match, i) => {
                if (match.metadata) {
                    console.log(`\n${i + 1}. Book: ${match.metadata.bookTitle}`);
                    console.log(`   Author: ${match.metadata.authorName}`);
                    console.log(`   Grade: ${match.metadata.grade}`);
                    console.log(`   Sensuality: ${match.metadata.sensuality}`);
                    console.log(`   Types: ${Array.isArray(match.metadata.bookTypes) ? match.metadata.bookTypes.join(', ') : match.metadata.bookTypes}`);
                    console.log(`   Tags: ${Array.isArray(match.metadata.reviewTags) ? match.metadata.reviewTags.join(', ') : match.metadata.reviewTags}`);
                    if (match.metadata.chunkType === 'comments') {
                        if (typeof match.metadata.text === 'string') {
                            console.log(`   Reader Comments: ${match.metadata.text.slice(0, 200)}...`);
                        } else {
                            console.log('   Reader Comments: No text available.');
                        }
                    } else {
                        if (typeof match.metadata.text === 'string') {
                            console.log(`   Review Excerpt: ${match.metadata.text.slice(0, 200)}...`);
                        } else {
                            console.log('   Review Excerpt: No text available.');
                        }
                    }
                    console.log(`   Score: ${match.score}`);
                }
            });
        } catch (error) {
            console.error(`Error processing query "${query}":`, error);
        }
    }
}

testRagQueries();

console.log('\nNote: These queries demonstrate the RAG system\'s ability to:');
console.log('1. Find books by rating and publication date');
console.log('2. Filter by sensuality rating');
console.log('3. Analyze reader sentiment from reviews');
console.log('4. Combine multiple search criteria');
console.log('5. Find reviews by specific reviewers');
console.log('6. Search by genre/book type');