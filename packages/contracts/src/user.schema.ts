import { z } from 'zod';

export const UserDTOSchema = z.object({
  id: z.string(), // VK user id, kept as a string end-to-end (see note in vk-launch-params.schema.ts)
  firstName: z.string(),
  lastName: z.string(),
  photoUrl: z.string().url().nullable(),
  lastPlatform: z.string().nullable().optional(),
});
export type UserDTO = z.infer<typeof UserDTOSchema>;

/** What the client sends to initialize/update a user profile. */
export const InitUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoUrl: z.string().url().optional(),
});
export type InitUserInput = z.infer<typeof InitUserSchema>;
