import { OpenAI } from 'openai';
import type { ProcessedReview } from '../types/wordpress.js';

export class ContentProcessor {
  private openai: OpenAI;

  constructor(openaiApiKey: string) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  createChunks(review: ProcessedReview): { text: string; metadata: any }[] {
    const baseMetadata = {
      postId: review.metadata.postId,
      title: review.metadata.title,
      bookTitle: review.metadata.bookTitle,
      authorName: review.metadata.authorName,
      reviewerName: review.metadata.reviewerName,
      url: review.metadata.url,
      amazonUrl: review.metadata.amazonUrl,
      asin: review.metadata.asin,
      featuredImage: review.metadata.featuredImage,
      grade: review.metadata.grade,
      sensuality: review.metadata.sensuality,
      publishDate: review.metadata.publishDate,
      postDate: review.metadata.postDate,
      bookTypes: review.metadata.bookTypes,
      reviewTags: review.metadata.reviewTags,
      comments: review.metadata.comments
    };

    // Create a single comprehensive chunk
    const mainChunk = {
      text: `
Review: ${review.metadata.bookTitle} by ${review.metadata.authorName}
Grade: ${review.metadata.grade}
Sensuality: ${review.metadata.sensuality}
Book Types: ${review.metadata.bookTypes.join(', ')}
Tags: ${review.metadata.reviewTags.join(', ')}
Reviewer: ${review.metadata.reviewerName}
Published: ${review.metadata.publishDate}
Review Date: ${review.metadata.postDate}

${review.content}

${review.metadata.comments.latest.map(comment => 
  `Comment by ${comment.commentAuthor}:
${comment.commentContent}
`).join('\n')}`,
      metadata: {
        ...baseMetadata,
        chunkType: 'complete',
        vectorId: `${review.metadata.postId}:complete:0`
      }
    };

    return [mainChunk];
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