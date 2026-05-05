// V5/src/lib/beta/types.ts
//
// Beta frontend data model — unified EngineRecord that subsumes V5's
// ShopVisitRecord + ForecastRecord. All beta dashboard / pipeline /
// forecast charts consume EngineRecord. The src/lib/beta/adapters.ts
// module builds EngineRecord[] from V5's separate shopVisits + forecasts.

export type EngineFamily =
  | "Trent 700"
  | "Trent 1000"
  | "Trent XWB-84"
  | "Trent XWB-97"
  | "Trent 7000"
  | "Trent 900";

export type WingState = "On-Wing" | "Off-Wing" | "In Storage" | "Inducted";

export type PipelineStage =
  | "Forecasted"
  | "Requested"
  | "Workscope Agreed"
  | "In Shop"
  | "Testing"
  | "ARC"
  | "Complete"
  | "Cancelled"
  | "On Hold";

export type SVType =
  | "C&R"
  | "HSV"
  | "Refurb"
  | "1st Refurb"
  | "2nd Refurb"
  | "Mature Refurb"
  | "BSI"
  | "OPERA SV"
  | "X-Cal"
  | "GVI";

export type SVReason =
  | "Time-ex"
  | "Transition"
  | "Damage"
  | "Preservation lapse"
  | "Liner loss"
  | "SAR investigation"
  | "FOD"
  | "Lease return"
  | "Test Bed Run"
  | "Operator request"
  | "Other";

export type ContractType = "TCA" | "LessorCare" | "ERS" | "C&R" | "T&M" | "OPERA" | "None";
export type Priority = 1 | 2 | 3 | 4;

export interface EngineRecord {
  esn: string;
  msn?: string;
  registration?: string;
  aircraftType?: string;
  engineType: EngineFamily;
  lessor: string;
  operator: string;
  lessorCarePlus?: boolean;
  leaseExpiry?: string;
  transitionDate?: string;
  transitionProbability?: number;
  wingState: WingState;
  removalDate?: string;
  fcsRemaining?: number;
  svProbability?: number;
  svType?: SVType;
  svReason?: SVReason;
  stage: PipelineStage;
  shop?: string;
  contractType?: ContractType;
  svPrice?: number;
  svContribution?: number;
  profit?: number;
  cashOutEligible?: boolean;
  cashOutProbability?: number;
  amResponsible?: string;
  taskOwner?: string;
  priority?: Priority;
  notes?: string;
  lastUpdated?: string;
}
