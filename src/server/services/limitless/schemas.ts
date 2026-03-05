import { z } from "zod/v4";

export const limitlessTournamentSchema = z.object({
  id: z.string(),
  game: z.string(),
  name: z.string(),
  date: z.string(),
  format: z.string().nullable().optional(),
  players: z.number().optional(),
  organizerId: z.number().optional(),
});

const decklistCardSchema = z.object({
  count: z.number(),
  set: z.string(),
  number: z.string(),
  name: z.string(),
});

export const limitlessStandingSchema = z.object({
  player: z.string(),
  name: z.string(),
  country: z.string().optional(),
  placing: z.number().nullable(),
  record: z.object({
    wins: z.number(),
    losses: z.number(),
    ties: z.number(),
  }).optional(),
  decklist: z.object({
    pokemon: z.array(decklistCardSchema).optional(),
    trainer: z.array(decklistCardSchema).optional(),
    energy: z.array(decklistCardSchema).optional(),
  }).nullable().optional(),
  deck: z.object({
    id: z.string(),
    name: z.string(),
    icons: z.array(z.string()).optional(),
  }).nullable().optional(),
  drop: z.number().nullable().optional(),
});

export const limitlessPairingSchema = z.object({
  round: z.number(),
  phase: z.number().optional(),
  table: z.number().optional(),
  match: z.string().optional(),
  player1: z.string(),
  player2: z.string().nullable(),
  winner: z.union([z.string(), z.number()]).nullable(),
});

export type LimitlessTournament = z.infer<typeof limitlessTournamentSchema>;
export type LimitlessStanding = z.infer<typeof limitlessStandingSchema>;
export type LimitlessPairing = z.infer<typeof limitlessPairingSchema>;
