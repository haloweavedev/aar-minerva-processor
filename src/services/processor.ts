import { OpenAI } from 'openai';
import type { ProcessedReview } from '../types/wordpress.js';

export class ContentProcessor {
  private openai: OpenAI;

  constructor(openaiApiKey: string) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  createChunks(review: ProcessedReview): { text: string; metadata: any }[] {
    const chunks: { text: string; metadata: any }[] = [];

    // Main review chunk
    chunks.push({
      text: `BOOK REVIEW: ${review.metadata.bookTitle} by ${review.metadata.authorName}
GRADE: ${review.metadata.grade}
SENSUALITY: ${review.metadata.sensuality}
BOOK TYPES: ${review.metadata.bookTypes.join(', ')}
TAGS: ${review.metadata.reviewTags.join(', ')}
REVIEWER: ${review.metadata.reviewerName}
PUBLISHED: ${review.metadata.publishDate}
REVIEW DATE: ${review.metadata.postDate}
REVIEW CONTENT: ${review.content}`,
      metadata: {
        ...review.metadata,
        chunkType: 'review',
      },
    });

    // Comments chunk (if there are comments)
    if (review.metadata.comments.count > 0) {
      const commentsText = review.metadata.comments.latest
        .map((comment) => `${comment.commentAuthor}: ${comment.commentContent}`)
        .join('\n\n');

      chunks.push({
        text: `READER COMMENTS FOR: ${review.metadata.bookTitle} by ${review.metadata.authorName}
${commentsText}`,
        metadata: {
          ...review.metadata,
          chunkType: 'comments',
        },
      });
    }

    // Book metadata chunk
    chunks.push({
      text: `BOOK INFO: ${review.metadata.bookTitle}
Author: ${review.metadata.authorName}
Published: ${review.metadata.publishDate}
Posted: ${review.metadata.postDate}
Grade: ${review.metadata.grade}
Sensuality Rating: ${review.metadata.sensuality}
Book Types: ${review.metadata.bookTypes.join(', ')}
Tags: ${review.metadata.reviewTags.join(', ')}
Review Link: ${review.metadata.url}
Buy Link: ${review.metadata.amazonUrl}
ASIN: ${review.metadata.asin}
Featured Image: ${review.metadata.featuredImage}
Reviewer: ${review.metadata.reviewerName}`,
      metadata: {
        ...review.metadata,
        chunkType: 'metadata',
      },
    });

    return chunks;
  }

  async createEmbeddings(chunks: { text: string; metadata: any }[]) {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunks.map((chunk) => chunk.text),
        encoding_format: "float",
      });

      return response.data.map((embedding) => embedding.embedding);
    } catch (error) {
      console.error('Error creating embeddings:', error);
      throw error;
    }
  }
}