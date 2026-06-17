export interface Instance {
  id: string;
  name: string;
  website: string;
  accountLabel?: string;
  configBlock: string;
  hourlyAllowance: string;
  weeklyAllowance: string;
  hourlyCooldownMs: number;
  weeklyCooldownMs: number;
  hourlyResetTimestamp: number;
  weeklyResetTimestamp: number;
  exhausted: boolean;
  weeklyExhausted: boolean;
}

export type InstanceStatus = "READY" | "SOON" | "COOLING";

export type QuotaFlag = "available" | "exhausted" | "weekly_exhausted";
