import { Pinecone } from '@pinecone-database/pinecone';

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
      
      const vectors = chunks.map((chunk, i) => ({
        id: `${chunk.metadata.postId}:${chunk.metadata.chunkType}:${i}`,
        values: embeddings[i],
        metadata: {
          text: chunk.text.slice(0, 1000),
          bookTitle: chunk.metadata.bookTitle,
          authorName: chunk.metadata.authorName,
          reviewerName: chunk.metadata.reviewerName,
          grade: chunk.metadata.grade,
          url: chunk.metadata.url,
          publishDate: chunk.metadata.publishDate,
          chunkType: chunk.metadata.chunkType,
          settingTime: chunk.metadata.setting?.time || '',
          settingLocation: chunk.metadata.setting?.location || '',
          sensuality: chunk.metadata.sensuality || '',
          series: chunk.metadata.series ? 'Yes' : 'No',
        },
      }));

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