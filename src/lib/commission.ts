export type Tier = {
  minPaise: number;
  maxPaise: number | null;
  percentage: number;
};
export const defaultTiers: Tier[] = [
  { minPaise: 0, maxPaise: 2000000, percentage: 20 },
  { minPaise: 2000000, maxPaise: 4000000, percentage: 30 },
  { minPaise: 4000000, maxPaise: null, percentage: 40 },
];
export function calculateCommission(
  projectPaise: number,
  receivedPaise: number,
  tiers: Tier[] = defaultTiers,
) {
  if (
    ![projectPaise, receivedPaise].every(
      (n) => Number.isSafeInteger(n) && n >= 0 && n <= 100000000000,
    ) ||
    receivedPaise > projectPaise
  )
    throw new Error("Invalid money amount");
  const tier = tiers.find(
    (t) =>
      projectPaise >= t.minPaise &&
      (t.maxPaise === null || projectPaise < t.maxPaise),
  );
  if (
    !tier ||
    !Number.isInteger(tier.percentage) ||
    tier.percentage < 0 ||
    tier.percentage > 100
  )
    throw new Error("No valid commission tier");
  return {
    percentage: tier.percentage,
    calculatedPaise: Number(
      (BigInt(receivedPaise) * BigInt(tier.percentage) + 50n) / 100n,
    ),
  };
}
export function rupeesToPaise(value: string) {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value))
    throw new Error("Enter a valid amount with at most two decimal places");
  const [whole, fraction = ""] = value.split(".");
  return Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")));
}
