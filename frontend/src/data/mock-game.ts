import type { LiveBet } from "../types/game";

export const initialLiveBets: LiveBet[] = [
  { playerId: "crypto_king", amountCents: "5000", status: "Ativo" },
  { playerId: "lucky_player", amountCents: "2500", status: "CASHED_OUT", cashoutMultiplier: 245, payoutCents: "6125" },
  { playerId: "moon_walker", amountCents: "10000", status: "Ativo" },
  { playerId: "diamond_hand", amountCents: "7500", status: "Ativo" },
  { playerId: "rush_gamer", amountCents: "3000", status: "Ativo" },
];

export const initialHistory = [542, 215, 108, 897, 324, 152, 289, 1245, 112, 267, 634, 178, 356, 423, 145, 291, 788, 123];
