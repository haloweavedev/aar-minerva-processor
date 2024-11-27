import { GraphQLClient } from 'graphql-request';
import type { BookReview, ProcessedReview } from '../types/wordpress.js';

export class WordPressService {
  private client: GraphQLClient;
  private lastId: string | null = null;

  constructor(baseUrl: string) {
    this.client = new GraphQLClient(`${baseUrl}/graphql`);
  }

  private readonly reviewsQuery = `
    query GetBookReviews($first: Int) {
      bookReviews(first: $first) {
        id
        title
        content
        date
        bookMetadata {
          bookTitle
          authorFirstName
          authorLastName
          bookGrade
          bookSensuality
          publishedDate
          amazonUrl
          featuredImage
          reviewerName
          bookTypes
          reviewTags
          commentCount
          comments {
            commentId
            commentAuthor
            commentContent
            commentDate
          }
        }
      }
    }
  `;

  async fetchRecentReviews(perPage: number = 5) {
    try {
      const response = await this.client.request<{ bookReviews: BookReview[] }>(
        this.reviewsQuery,
        { first: perPage }
      );

      return response.bookReviews.map(review => this.processReview(review));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  private processReview(review: BookReview): ProcessedReview {
    const metadata = review.bookMetadata;
    const asin = this.extractAsinFromUrl(metadata.amazonUrl || '');
    
    return {
      id: `review:${review.id}`,
      content: review.content,
      date: review.date,
      metadata: {
        postId: review.id,
        title: review.title,
        bookTitle: metadata.bookTitle,
        authorName: `${metadata.authorFirstName} ${metadata.authorLastName}`.trim(),
        reviewerName: metadata.reviewerName,
        url: `https://allaboutromance.com/?p=${review.id}`,
        amazonUrl: metadata.amazonUrl || '',
        asin,
        featuredImage: metadata.featuredImage,
        grade: metadata.bookGrade,
        sensuality: metadata.bookSensuality,
        publishDate: metadata.publishedDate,
        postDate: review.date,
        bookTypes: metadata.bookTypes || [],
        reviewTags: metadata.reviewTags || [],
        setting: {
          time: '',
          location: ''
        },
        comments: {
          count: metadata.commentCount,
          latest: metadata.comments || []
        }
      }
    };
  }

  private extractAsinFromUrl(url: string): string {
    if (!url) return '';
    const asinMatch = url.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
    return asinMatch ? asinMatch[1] : '';
  }
}