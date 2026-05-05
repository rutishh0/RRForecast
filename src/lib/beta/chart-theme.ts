// V5/src/lib/beta/chart-theme.ts — chart color palette
import type { EngineFamily, PipelineStage } from "./types";

export const RAMP = ["#0e3a5f", "#1f6fb2", "#5b9bd5", "#a4c4e6", "#d6e3f1", "#eef4fa"] as const;

export const CAT: Record<EngineFamily, string> = {
  "Trent XWB-84": "#0e3a5f",
  "Trent XWB-97": "#0d9488",
  "Trent 7000": "#d97706",
  "Trent 1000": "#7c3aed",
  "Trent 700": "#e11d48",
  "Trent 900": "#15803d",
};

export const STAGE_COLOR: Record<PipelineStage, string> = {
  Forecasted: "#94a3b8",
  Requested: "#64748b",
  "Workscope Agreed": "#1f6fb2",
  "In Shop": "#0e3a5f",
  Testing: "#0d9488",
  ARC: "#d97706",
  Complete: "#15803d",
  Cancelled: "#dc2626",
  "On Hold": "#b45309",
};

export const STATUS = {
  critical: "#dc2626",
  warning: "#d97706",
  healthy: "#15803d",
  info: "#1f6fb2",
  neutral: "#64748b",
} as const;

export const GRID = "#e6e2d8";
export const AXIS = "#9ca0a8";
export const LABEL = "#475569";
