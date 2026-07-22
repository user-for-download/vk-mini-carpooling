import { z } from 'zod';

export const UserDTOSchema = z.object({
  id: z.string(), // VK user id, kept as a string end-to-end (see note in vk-launch-params.schema.ts)
  firstName: z.string(),
  lastName: z.string(),
  photoUrl: z.string().url().nullable(),
});
export type UserDTO = z.infer<typeof UserDTOSchema>;
