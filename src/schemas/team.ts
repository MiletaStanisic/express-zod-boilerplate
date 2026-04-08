import { z } from "zod";

export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string()
});

export type Team = z.infer<typeof teamSchema>;

export const shiftSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  memberId: z.string(),
  role: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  createdAt: z.string()
});

export type Shift = z.infer<typeof shiftSchema>;
