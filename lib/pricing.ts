import { Tier } from './types';

export interface TierConfig {
  id: Tier;
  name: string;
  priceInr: number;
  participantCap: number;
  durationDays: number;
  description: string;
}

export const PRICING_TIERS: Record<Tier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceInr: 0,
    participantCap: 25,
    durationDays: 36500, // Effectively infinite
    description: 'Perfect for small meetings and classrooms',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceInr: 499,
    participantCap: 100,
    durationDays: 7,
    description: 'Ideal for medium-sized workshops and webinars',
  },
  event: {
    id: 'event',
    name: 'Event',
    priceInr: 1499,
    participantCap: 500,
    durationDays: 7,
    description: 'For large corporate events and town halls',
  },
  fest: {
    id: 'fest',
    name: 'Fest',
    priceInr: 4999,
    participantCap: 2000,
    durationDays: 7,
    description: 'For massive online festivals and broadcasts',
  },
};
