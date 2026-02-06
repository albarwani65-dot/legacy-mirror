import { z } from "zod";

export const AssetCategoryEnum = z.enum([
  "CASH",
  "EQUITY",
  "REAL_ESTATE",
  "CRYPTO",
  "VEHICLE",
  "EOSB",
]);

export type AssetCategory = z.infer<typeof AssetCategoryEnum>;

export const AssetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string().min(2),
  category: AssetCategoryEnum,
  value: z.number().int().positive(), // Integer cents/fils. STRICTLY POSITIVE
  qty: z.number().optional(), // For stocks/gold
  ticker: z.string().optional(), // For live lookups
  lastUpdated: z.number(), // Timestamp
  // Real Estate / Advanced Fields
  marketValue: z.number().optional(), // In cents
  loanValue: z.number().optional(), // In cents
  accountNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

export const HistorySchema = z.object({
  assetId: z.string(),
  date: z.number(),
  value: z.number(),
});

export type HistoryRecord = z.infer<typeof HistorySchema>;
