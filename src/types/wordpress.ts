// src/types/wordpress.ts
export interface BookReviewComment {
  commentId: string;
  commentAuthor: string;
  commentContent: string;
  commentDate: string;
}

export interface BookReviewMetadata {
  bookTitle: string;
  authorFirstName: string;
  authorLastName: string;
  bookGrade: string;
  bookSensuality: string;
  publishedDate: string;
  amazonUrl: string;
  asin?: string;
  featuredImage: string;
  reviewerName: string;
  bookTypes: string[];
  reviewTags: string[];
  commentCount: number;
  comments: BookReviewComment[];
}

export interface BookReview {
  id: string;
  title: string;
  content: string;
  date: string;
  bookMetadata: BookReviewMetadata;
}

export interface ProcessedReview {
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
    content: string;
    comments: {
      count: number;
      latest: BookReviewComment[];
    };
  };
}

// src/types/pinecone.ts
export interface ReviewMetadata {
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
  comments: {
    count: number;
    latest: BookReviewComment[];
  };
}

export interface PineconeVector {
  id: string;
  values: number[];
  metadata: ReviewMetadata;
}