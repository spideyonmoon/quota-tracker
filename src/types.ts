export interface Instance {
  id: string;
  name: string;
  website: string;
  accountLabel?: string;
  configBlock: string;
  hourlyAllowance: string;
  weeklyAllowance: string;
  hourlyResetTimestamp: number;
  weeklyResetTimestamp: number;
  exhausted: boolean;
}

export type InstanceStatus = "READY" | "SOON" | "COOLING";
