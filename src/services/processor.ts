// src/services/processor.ts
import { OpenAI } from 'openai';
import type { ProcessedReview } from '../types/wordpress.js';

// Define a type for the comment if not already defined
interface Comment {
  commentAuthor: string;
  commentContent: string;
}

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
REVIEW CONTENT: ${review.content}`,
      metadata: {
        ...review.metadata,
        chunkType: 'review',
      }
    });

    // Comments chunk (if there are comments)
    if (review.metadata.comments.count > 0) {
      const commentsText = review.metadata.comments.latest
        .map((comment: Comment) => `${comment.commentAuthor}: ${comment.commentContent}`)
        .join('\n\n');

      chunks.push({
        text: `READER COMMENTS FOR: ${review.metadata.bookTitle} by ${review.metadata.authorName}
${commentsText}`,
        metadata: {
          ...review.metadata,
          chunkType: 'comments',
        }
      });
    }

    // Book metadata chunk
    chunks.push({
      text: `BOOK INFO: ${review.metadata.bookTitle}
Author: ${review.metadata.authorName}
Published: ${review.metadata.publishDate}
Setting: ${review.metadata.setting.time}, ${review.metadata.setting.location}
Sensuality Rating: ${review.metadata.sensuality}
Grade: ${review.metadata.grade}`,
      metadata: {
        ...review.metadata,
        chunkType: 'metadata',
      }
    });

    return chunks;
  }

  async createEmbeddings(chunks: { text: string; metadata: any }[]) {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunks.map(chunk => chunk.text),
        encoding_format: "float",
      });

      return response.data.map(embedding => embedding.embedding);
    } catch (error) {
      console.error('Error creating embeddings:', error);
      throw error;
    }
  }
}