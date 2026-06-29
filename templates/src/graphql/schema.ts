import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    hello: String!
    examples: [Example!]!
  }

  type Mutation {
    createExample(name: String!): Example!
  }

  type Example {
    id: ID!
    name: String!
  }
`;
