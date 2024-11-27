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
  publishedDate: string;  // Original publication date of the book
  amazonUrl: string;
  asin: string;          // Adding ASIN
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
  date: string;          // Post publication date
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
    setting: {
      time: string;
      location: string;
    };
    comments: {
      count: number;
      latest: BookReviewComment[];
    };
  };
}