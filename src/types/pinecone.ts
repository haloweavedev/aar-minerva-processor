// src/types/pinecone.ts
export interface ReviewMetadata {
  [key: string]: any;
  postId: string;
  title: string;
  text: string;
  bookTitle: string;
  authorName: string;
  reviewerName: string;
  grade: string;
  url: string;
  amazonUrl: string;
  asin: string;
  featuredImage: string;
  publishDate: string;
  postDate: string;
  chunkType: 'review' | 'comments' | 'metadata';
  sensuality: string;
  bookTypes: string[];
  reviewTags: string[];
  commentCount: number;
  commentAuthors: string[];
  commentContents: string[];
}

export interface PineconeVector {
  id: string;
  values: number[];
  metadata: ReviewMetadata;
}