import { Schema, model, type InferSchemaType } from 'mongoose';

const exampleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { timestamps: true }
);

export type Example = Omit<InferSchemaType<typeof exampleSchema>, '_id'> & { _id: string };
export const ExampleModel = model('Example', exampleSchema);
