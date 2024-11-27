// src/types/pinecone.ts
export interface ReviewMetadata {
  text: string;
  bookTitle: string;
  authorName: string;
  reviewerName: string;
  grade: string;
  url: string;
  publishDate: string;
  chunkType: 'review' | 'comments' | 'metadata';
  sensuality: string;
  bookTypes: string[];
  reviewTags: string[];
}

export interface PineconeVector {
  id: string;
  values: number[];
  metadata: ReviewMetadata;
}