import { z } from 'zod';

export const CarrierCsvLineSchema = z.object({
  tracking_number: z.string().min(3),
  carrier_name: z.string().min(2),
  collected_amount_cents: z.number().int().nonnegative(),
  shipping_fee_cents: z.number().int().nonnegative(),
  delivery_status: z.enum(['DELIVERED', 'RETURNED', 'IN_TRANSIT'])
});

export type CarrierCsvLine = z.infer<typeof CarrierCsvLineSchema>;
