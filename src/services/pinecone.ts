// src/services/pinecone.ts
import { Pinecone } from '@pinecone-database/pinecone';
import type { ReviewMetadata } from '../types/pinecone.js';

export class PineconeService {
  private pineconeClient: Pinecone;
  private indexName: string;

  constructor(apiKey: string, environment: string, indexName: string) {
    this.pineconeClient = new Pinecone({
      apiKey,
    });
    this.indexName = indexName;
  }

  async verifyIndex(): Promise<boolean> {
    try {
      const indexList = await this.pineconeClient.listIndexes();
      return indexList.indexes?.some((idx: any) => idx.name === this.indexName) || false;
    } catch (error) {
      console.error('Error verifying index:', error);
      return false;
    }
  }

  async upsertVectors(chunks: { text: string; metadata: any }[], embeddings: number[][]) {
    try {
      const index = this.pineconeClient.index(this.indexName);
      
      const vectors = chunks.map((chunk, i) => {
        // Convert comments to simple arrays for Pinecone
        const commentAuthors = chunk.metadata.comments?.latest?.map((c: { commentAuthor: string }) => c.commentAuthor) || [];
        const commentContents = chunk.metadata.comments?.latest?.map((c: { commentContent: string }) => c.commentContent) || [];

        return {
          id: `${chunk.metadata.postId}:${chunk.metadata.chunkType}:${i}`,
          values: embeddings[i],
          metadata: {
            postId: chunk.metadata.postId,
            title: chunk.metadata.title,
            text: chunk.text.slice(0, 1000),
            bookTitle: chunk.metadata.bookTitle,
            authorName: chunk.metadata.authorName,
            reviewerName: chunk.metadata.reviewerName,
            grade: chunk.metadata.grade,
            url: chunk.metadata.url,
            amazonUrl: chunk.metadata.amazonUrl || '',
            asin: chunk.metadata.asin || '',
            featuredImage: chunk.metadata.featuredImage || '',
            publishDate: chunk.metadata.publishDate,
            postDate: chunk.metadata.postDate,
            chunkType: chunk.metadata.chunkType,
            sensuality: chunk.metadata.sensuality,
            bookTypes: chunk.metadata.bookTypes || [],
            reviewTags: chunk.metadata.reviewTags || [],
            commentCount: chunk.metadata.comments?.count || 0,
            commentAuthors,
            commentContents,
          } as ReviewMetadata,
        };
      });

      // Upsert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
        console.log(`Upserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(vectors.length / batchSize)}`);
      }
    } catch (error) {
      console.error('Error upserting vectors:', error);
      throw error;
    }
  }

  async query(vector: number[], topK: number = 5) {
    try {
      const index = this.pineconeClient.index(this.indexName);
      
      const queryResponse = await index.query({
        vector,
        topK,
        includeMetadata: true,
      });

      return queryResponse.matches;
    } catch (error) {
      console.error('Error querying vectors:', error);
      throw error;
    }
  }
}