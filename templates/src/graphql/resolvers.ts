const store = new Map<string, { id: string; name: string }>();

export const resolvers = {
  Query: {
    hello: () => 'world',
    examples: () => [...store.values()],
  },
  Mutation: {
    createExample: (_p: unknown, args: { name: string }) => {
      const id = crypto.randomUUID();
      const item = { id, name: args.name };
      store.set(id, item);
      return item;
    },
  },
};
