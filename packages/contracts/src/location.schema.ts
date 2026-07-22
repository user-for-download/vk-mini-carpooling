import { z } from 'zod';

export const LocationDTOSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(120),
  district: z.string().max(120).nullable(),
});
export type LocationDTO = z.infer<typeof LocationDTOSchema>;
