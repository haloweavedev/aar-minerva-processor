import { GraphQLClient } from 'graphql-request';
import * as dotenv from 'dotenv';

dotenv.config();

const WORDPRESS_URL = process.env.WORDPRESS_URL ?? 'https://allaboutromance.com';
const GRAPHQL_ENDPOINT = `${WORDPRESS_URL}/graphql`;

const query = `
  query GetBookReviews {
    bookReviews(first: 2) {
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

async function testBookReviews() {
  const client = new GraphQLClient(GRAPHQL_ENDPOINT);

  try {
    console.log('Testing book-review GraphQL query...');
    const response = await client.request(query);
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('\nGraphQL Error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      // Log the full error object for debugging
      console.error('Full error:', JSON.stringify(error, null, 2));
    }
  }
}

testBookReviews();

export { testBookReviews };