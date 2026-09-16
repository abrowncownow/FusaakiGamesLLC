import type { CharterChoiceId, CharterRun } from "./charter.js";
import type { JourneyActionId, JourneyRun } from "./journey.js";

export const WORLD_VERSION = 4;
export const WORKSHOP_COST = { timber: 24, ore: 8 } as const;
export const TIMBER_REQUIRED = WORKSHOP_COST.timber;
export const TRAVEL_DAYS = 3;
export const CONVOY_CAPACITY = 12;
export const TOOL_TARGET = 2;
export const TOOL_COST = { timber: 2, ore: 1 } as const;
export type SettlementId = "willow" | "bracken";
export type Profile = "novice" | "skilled";
export type Scenario = "balanced" | "food-shortage" | "small-crew";
export type RawResource = "timber" | "ore";
export type Inventory = Record<"food" | "timber" | "ore" | "tools", number>;
export const inventory = (): Inventory => ({
  food: 0,
  timber: 0,
  ore: 0,
  tools: 0,
});

export interface Convoy {
  id: string;
  resource: RawResource;
  amount: number;
  travelRemaining: number;
  escorts: number;
  provisions: number;
  intercepted: boolean;
}

export type Action =
  | { type: "gather"; resource: RawResource; workers: number }
  | { type: "dispatch"; resource: RawResource; escorts: number; amount: number }
  | { type: "build"; workers: number }
  | { type: "craft"; workers: number }
  | { type: "rest" };

export interface Candidate {
  label: string;
  action: Action;
  score: number;
  feasible: boolean;
  reason: string;
}

export interface Plan {
  chosen: Candidate;
  candidates: Candidate[];
  workers: {
    foraging: number;
    production: number;
    traveling: number;
    resting: number;
  };
}

export interface Settlement {
  id: SettlementId;
  name: string;
  workers: number;
  home: Inventory;
  field: Record<RawResource, number>;
  used: Record<RawResource, number>;
  workshop: {
    complete: boolean;
    work: number;
    reserved: Record<RawResource, number>;
  };
  convoy: Convoy | null;
  priorities: { growth: number; security: number };
  threatFromPlayer: number;
  losses: Record<RawResource, number>;
  lastAction: string;
  plan: Plan;
}

export interface World {
  version: typeof WORLD_VERSION;
  runId: number;
  charter: CharterRun | null;
  journey: JourneyRun | null;
  tick: number;
  seed: number;
  randomState: number;
  scenario: Scenario;
  forestTimber: number;
  mineOre: number;
  nextConvoyId: number;
  settlements: Settlement[];
  player: {
    assignment: { settlementId: SettlementId; profile: Profile } | null;
    inventory: Inventory;
    lastRaidTick: number | null;
  };
  ledger: { foodGathered: number; foodConsumed: number; toolsCrafted: number };
  events: {
    tick: number;
    kind: "decision" | "shipment" | "raid" | "project" | "player";
    text: string;
  }[];
}

export type Command =
  | { type: "start-journey"; runId: number }
  | {
      type: "journey-action";
      runId: number;
      revision: number;
      action: JourneyActionId;
    }
  | { type: "start-charter"; patron: SettlementId; runId: number }
  | {
      type: "charter-choice";
      runId: number;
      revision: number;
      choice: CharterChoiceId;
    }
  | { type: "advance"; steps: number }
  | { type: "next-convoy" }
  | { type: "join"; settlementId: SettlementId; profile: Profile }
  | { type: "leave" }
  | { type: "intercept"; settlementId: SettlementId; convoyId: string }
  | { type: "reset"; scenario?: Scenario; seed?: number };
