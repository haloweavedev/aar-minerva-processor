import { GraphQLClient } from 'graphql-request';
import * as dotenv from 'dotenv';

dotenv.config();

const WORDPRESS_URL = process.env.WORDPRESS_URL ?? 'https://allaboutromance.com';
const GRAPHQL_ENDPOINT = `${WORDPRESS_URL}/graphql`;

const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      queryType {
        name
        fields {
          name
          description
          args {
            name
            description
            type {
              name
            }
          }
        }
      }
      types {
        name
        description
        fields {
          name
          description
        }
      }
    }
  }
`;

async function testSchema() {
  const client = new GraphQLClient(GRAPHQL_ENDPOINT);

  try {
    console.log('Fetching GraphQL Schema...\n');
    const response = await client.request(introspectionQuery) as { 
      __schema: { 
        queryType: { fields: Array<{ name: string }> }, 
        types: Array<{ name: string, fields: Array<{ name: string, description?: string }> }>
      } 
    };
    
    console.log('Available Query Fields:');
    console.log('====================');
    response.__schema.queryType.fields.forEach((field: any) => {
      console.log(`- ${field.name}`);
    });

    console.log('\nLooking for post types...');
    const postTypes = response.__schema.types.find((type: any) => 
      type.name === 'RootQuery'
    )?.fields.filter((field: any) => 
      field.name.toLowerCase().includes('post') || 
      field.name.toLowerCase().includes('review') ||
      field.name.toLowerCase().includes('book')
    );

    if (postTypes && postTypes.length > 0) {
      console.log('\nRelevant Query Fields:');
      postTypes.forEach((field: any) => {
        console.log(`- ${field.name}: ${field.description || 'No description'}`);
      });
    }

  } catch (error) {
    console.error('GraphQL Error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}

// Run the test if this is the main module
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  testSchema()
    .then(() => console.log('\nSchema inspection completed'))
    .catch(error => {
      console.error('\nTest failed:', error);
      process.exit(1);
    });
}

export { testSchema };