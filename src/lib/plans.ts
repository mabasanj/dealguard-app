export const subscriptionPlans = [
  {
    id: 'FREE',
    name: 'Free',
    description: 'Basic access with limited escrow volume.',
    monthlyFee: 0,
    annualFee: 0,
    maxEscrows: 5,
  },
  {
    id: 'BASIC',
    name: 'Basic',
    description: 'For active traders with higher escrow capacity.',
    monthlyFee: 9.99,
    annualFee: 99.99,
    maxEscrows: 25,
  },
  {
    id: 'PRO',
    name: 'Pro',
    description: 'Advanced features for power users and small businesses.',
    monthlyFee: 29.99,
    annualFee: 299.99,
    maxEscrows: 100,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Custom plan for large businesses and high-volume traders.',
    monthlyFee: 99.99,
    annualFee: 999.99,
    maxEscrows: 500,
  },
];

export type PlanId = (typeof subscriptionPlans)[number]['id'];
