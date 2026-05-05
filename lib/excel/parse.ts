import * as XLSX from "xlsx";

// ============================================================
// Type Definitions
// (Ported verbatim from V4/dashboard/src/types/index.ts)
// ============================================================

/** Full Forecast row (Sheet 1) — Shop Visit Tracker */
export interface ShopVisitRecord {
  // ---- Asset Identity ----
  lessor: string;
  lessorCarePlus: string;
  operator: string;
  esn: string;
  msn: string;              // MSN (separate from ESN in v2 tracker)
  aircraftType: string;     // Aircraft Type
  registration: string;     // Registration
  engineType: string;
  wingStatus: string;        // On-Wing / Off-Wing

  // ---- Lease & Transition ----
  leaseExpiry: string;       // Lease Expiry
  transitionDate: string;    // Transition Date
  removalDate: string;
  transitionProbability: number | null;
  svProbability: number | null;
  totalSvContribution: number | null;
  fcsRemaining: string;
  amContact: string;

  // ---- SV Information ----
  inductionGate: string;
  svType: string;
  svReason: string;
  dateSvRequested: string;
  requiredOutputDate: string;
  status: string;
  mfaOperatorRef: string;
  mfaInductionDate: string;
  inductionStatus: string;
  shop: string;
  offlogStatus: string;
  workscopeAgreed: string;
  plannedToTest: string;
  plannedToArc: string;
  riskToCustomer: string;

  // ---- Contract Information ----
  contractInPlace: string;
  contractType: string;
  contractRef: string;

  // ---- SV Payment Terms ----
  fullyFunded: string;
  paymentTerms: string;     // Payment Terms (v2 tracker)
  mfaInductionDate2: string;
  poRequested: string;
  customerPoRef: string;
  networkPaying: string;
  networkInMfa: string;

  // ---- Financial (v2 Tracker) ----
  svPrice: string;
  profit: string;
  cashOutEligible: string;
  cashOutProbability: number | null;

  // ---- CRCs ----
  crcsApplicable: string;
  backingDataReceived: string;
  backingDataSent: string;
  invoicePayment: string;
  customerMaster: string;
  addressForCrc: string;
  crcContact: string;
  comments: string;

  // ---- Ownership & Actions (v2 Tracker) ----
  taskOwner: string;
  priority: string;
  openActions: string;
  lastUpdated: string;
  nextSteps: string;

  // Internal
  _rowIndex: number;
}

/** 2026 Forecast row (Sheet 2) — Engine Forecasting */
export interface ForecastRecord {
  lessor: string;
  lessorCarePlus: string;
  operator: string;
  esn: string;
  engineType: string;
  wingStatus: string;
  removalDate: string;
  comment: string;
  svTypeNeeded: string;
  svPrice: string;
  cashOutEligible: string;
  profitMillion: string;
  priority: string;
  notes: string;
  _rowIndex: number;
}

/** Parsed workbook result */
export interface ParsedWorkbook {
  shopVisits: ShopVisitRecord[];
  forecasts: ForecastRecord[];
}

// ============================================================
// Column-header-to-key mapping for Sheet 1 (Full Forecast)
// (Ported verbatim from V4/dashboard/src/utils/parseExcel.ts)
// ============================================================
const SHOP_VISIT_COL_MAP: Record<string, keyof ShopVisitRecord> = {
  'lessor': 'lessor',
  'lessorcare+?': 'lessorCarePlus',
  'lessorcare+': 'lessorCarePlus',
  'operator': 'operator',
  'esn/msn': 'esn',
  'esn': 'esn',
  'msn': 'msn',
  'engine type': 'engineType',
  'on-wing/off-wing': 'wingStatus',
  'removal date': 'removalDate',
  'transition probability': 'transitionProbability',
  'sv probability': 'svProbability',
  'total sv contribution': 'totalSvContribution',
  'am contact for sv': 'amContact',
  'am contact': 'amContact',
  'induction gate? (e.g. inspection)': 'inductionGate',
  'induction gate': 'inductionGate',
  'sv type': 'svType',
  'sv reason': 'svReason',
  "fc's remaining at removal": 'fcsRemaining',
  'fcs remaining at removal': 'fcsRemaining',
  'fcs remaining': 'fcsRemaining',
  'date sv requested by com': 'dateSvRequested',
  'date sv requested': 'dateSvRequested',
  'required engine output date': 'requiredOutputDate',
  'status': 'status',
  'mfa operator ref': 'mfaOperatorRef',
  'mfa induction date': 'mfaInductionDate',
  'shop': 'shop',
  'offlog provided / checked / uploaded (30 days before induction)': 'offlogStatus',
  'offlog provided': 'offlogStatus',
  'offlog status': 'offlogStatus',
  'workscope agreed by customer': 'workscopeAgreed',
  'workscope agreed': 'workscopeAgreed',
  'planned to test': 'plannedToTest',
  'planned to arc': 'plannedToArc',
  'risk to customer requirement': 'riskToCustomer',
  'risk to customer': 'riskToCustomer',
  'contract in place?': 'contractInPlace',
  'contract in place': 'contractInPlace',
  'contract type': 'contractType',
  'contract reference & deg': 'contractRef',
  'contract reference': 'contractRef',
  'fully funded by opera/lifekey': 'fullyFunded',
  'fully funded': 'fullyFunded',
  'invoice required/ invoice prior to induction?': 'fullyFunded',
  'mfa induction date2': 'mfaInductionDate2',
  'po requested & amount': 'poRequested',
  'po requested': 'poRequested',
  'customer po reference': 'customerPoRef',
  'customer po ref': 'customerPoRef',
  'network (who is paying)': 'networkPaying',
  'network': 'networkPaying',
  'network noted in mfa work order': 'networkInMfa',
  "crc's applicable?": 'crcsApplicable',
  'crcs applicable': 'crcsApplicable',
  'backing data received?': 'backingDataReceived',
  'backing data received': 'backingDataReceived',
  'backing data sent to customer?': 'backingDataSent',
  'backing data sent': 'backingDataSent',
  'invoice no and payment date (green = paid)?': 'invoicePayment',
  'invoice no and payment date': 'invoicePayment',
  'customer master - sold to requested': 'customerMaster',
  'customer master': 'customerMaster',
  'address for crc team': 'addressForCrc',
  'address': 'addressForCrc',
  'crc contact person': 'crcContact',
  'crc contact': 'crcContact',
  'comments': 'comments',

  // --- New template aliases (Lessor_SV_Planning_Template) ---
  'current operator': 'operator',
  'current status': 'status',
  'removal date forecast': 'removalDate',
  'shop visit probability': 'svProbability',
  'am responsible': 'amContact',
  'proposed overhaul base': 'shop',
  'proposed induction date': 'mfaInductionDate',

  // --- Lessor SV Status sheet aliases ---
  'customer': 'lessor',
  'induction status': 'inductionStatus',
  'sv type (inc. core workscope summary)': 'svType',
  'offlog provided / checked / uploaded': 'offlogStatus',
  'fully funded by opera/delay invoice requested/ invoice prior to induction?': 'fullyFunded',
  'fully funded by opera/delay': 'fullyFunded',

  // --- Lessor_SV_Tracker_v2 aliases ---
  'tca / lessorcare+': 'lessorCarePlus',
  'tca': 'lessorCarePlus',
  'aircraft type': 'aircraftType',
  'registration': 'registration',
  'lease expiry': 'leaseExpiry',
  'transition date': 'transitionDate',
  'transition prob.': 'transitionProbability',
  'transition prob': 'transitionProbability',
  'removal date (fcst)': 'removalDate',
  'reqd engine output': 'requiredOutputDate',
  'mfa ref': 'mfaOperatorRef',
  'overhaul base': 'shop',
  'contract ref / deg': 'contractRef',
  'payment terms': 'paymentTerms',
  'po status & amt': 'poRequested',
  'po status': 'poRequested',
  'network (payer)': 'networkPaying',
  'sv price ($)': 'svPrice',
  'sv price': 'svPrice',
  'profit ($)': 'profit',
  'profit': 'profit',
  'cash out eligible': 'cashOutEligible',
  'cash out prob.': 'cashOutProbability',
  'cash out prob': 'cashOutProbability',
  'task owner': 'taskOwner',
  'priority': 'priority',
  'open actions / issues': 'openActions',
  'open actions': 'openActions',
  'last updated': 'lastUpdated',
  'next steps': 'nextSteps',
};

// ============================================================
// Column-header-to-key mapping for Sheet 2 (2026 Forecast)
// ============================================================
const FORECAST_COL_MAP: Record<string, keyof ForecastRecord> = {
  'lessor': 'lessor',
  'lessorcare+?': 'lessorCarePlus',
  'lessorcare+': 'lessorCarePlus',
  'operator': 'operator',
  'esn/msn': 'esn',
  'esn': 'esn',
  'engine type': 'engineType',
  'on-wing/off-wing': 'wingStatus',
  'removal date': 'removalDate',
  'comment': 'comment',
  'type of sv needed': 'svTypeNeeded',
  'sv type': 'svTypeNeeded',
  'sv price': 'svPrice',
  'cash out eligible?': 'cashOutEligible',
  'cash out eligible': 'cashOutEligible',
  'profit $m': 'profitMillion',
  'profit': 'profitMillion',
  'priority': 'priority',
  'notes': 'notes',

  // --- New template aliases (Lessor_SV_Planning_Template) ---
  'current operator': 'operator',
  'removal date forecast': 'removalDate',
  'sv type (if known)': 'svTypeNeeded',
  'sv price ($)': 'svPrice',
  'profit ($)': 'profitMillion',
  'assessed priority': 'priority',
};

/** Safely coerce a cell value to string */
function cellStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    // Excel dates are serial numbers; try to detect
    if (val > 40000 && val < 60000) {
      try {
        const dateStr = XLSX.SSF.format('dd/mm/yy', val);
        return dateStr;
      } catch {
        return String(val);
      }
    }
    return String(val);
  }
  return String(val).trim();
}

/** Safely coerce a cell value to number or null */
function cellNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[%,$]/g, '').trim();
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

/** Find the header row index — looks for a row containing key header markers */
function findHeaderRow(sheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  for (let r = range.s.r; r <= Math.min(range.e.r, 20); r++) {
    const vals: string[] = [];
    for (let c = range.s.c; c <= Math.min(range.e.c, 50); c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      if (cell) vals.push(String(cell.v || '').toLowerCase().trim());
    }
    const joined = vals.join(' ');
    // Match rows that have typical header keywords
    const hasLessorOrCustomer = joined.includes('lessor') || joined.includes('customer');
    const hasIdentifier = joined.includes('operator') || joined.includes('esn');
    if (hasLessorOrCustomer && hasIdentifier) {
      return r;
    }
  }
  return 0; // fallback
}

/** Build column mapping from header row */
function buildColMapping<T>(
  sheet: XLSX.WorkSheet,
  headerRow: number,
  colMap: Record<string, keyof T>
): Map<number, keyof T> {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const mapping = new Map<number, keyof T>();

  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRow, c });
    const cell = sheet[addr];
    if (!cell) continue;

    let header = String(cell.v || '').toLowerCase().trim();
    // Strip line breaks
    header = header.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');

    if (colMap[header]) {
      mapping.set(c, colMap[header]);
    } else {
      // Try partial matching
      for (const [pattern, key] of Object.entries(colMap)) {
        if (header.includes(pattern) || pattern.includes(header)) {
          if (!mapping.has(c)) mapping.set(c, key as keyof T);
          break;
        }
      }
    }
  }
  return mapping;
}

/** Parse Sheet 1: Full Forecast → ShopVisitRecord[] */
function parseFullForecast(sheet: XLSX.WorkSheet): ShopVisitRecord[] {
  const headerRow = findHeaderRow(sheet);
  const mapping = buildColMapping<ShopVisitRecord>(sheet, headerRow, SHOP_VISIT_COL_MAP);
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const records: ShopVisitRecord[] = [];

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const row: Partial<ShopVisitRecord> = { _rowIndex: r };

    for (const [c, key] of mapping.entries()) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      const val = cell ? cell.v : null;

      if (key === 'transitionProbability' || key === 'svProbability' || key === 'totalSvContribution' || key === 'cashOutProbability') {
        (row as any)[key] = cellNum(val);
      } else {
        (row as any)[key] = cellStr(val);
      }
    }

    // Skip rows that are clearly empty (no lessor AND no operator AND no esn)
    if (!row.lessor && !row.operator && !row.esn) continue;

    records.push(fillDefaults(row));
  }

  return records;
}

/** Parse Sheet 2: 2026 Forecast → ForecastRecord[] */
function parseForecast(sheet: XLSX.WorkSheet): ForecastRecord[] {
  const headerRow = findHeaderRow(sheet);
  const mapping = buildColMapping<ForecastRecord>(sheet, headerRow, FORECAST_COL_MAP);
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const records: ForecastRecord[] = [];

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const row: Partial<ForecastRecord> = { _rowIndex: r };

    for (const [c, key] of mapping.entries()) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      const val = cell ? cell.v : null;
      (row as any)[key] = cellStr(val);
    }

    if (!row.lessor && !row.operator && !row.esn) continue;

    records.push(fillForecastDefaults(row));
  }

  return records;
}

/** Fill missing fields with defaults */
function fillDefaults(partial: Partial<ShopVisitRecord>): ShopVisitRecord {
  return {
    lessor: partial.lessor || '',
    lessorCarePlus: partial.lessorCarePlus || '',
    operator: partial.operator || '',
    esn: partial.esn || '',
    msn: partial.msn || '',
    aircraftType: partial.aircraftType || '',
    registration: partial.registration || '',
    engineType: partial.engineType || '',
    wingStatus: partial.wingStatus || '',
    leaseExpiry: partial.leaseExpiry || '',
    transitionDate: partial.transitionDate || '',
    removalDate: partial.removalDate || '',
    transitionProbability: partial.transitionProbability ?? null,
    svProbability: partial.svProbability ?? null,
    totalSvContribution: partial.totalSvContribution ?? null,
    fcsRemaining: partial.fcsRemaining || '',
    amContact: partial.amContact || '',
    inductionGate: partial.inductionGate || '',
    svType: partial.svType || '',
    svReason: partial.svReason || '',
    dateSvRequested: partial.dateSvRequested || '',
    requiredOutputDate: partial.requiredOutputDate || '',
    status: partial.status || partial.inductionStatus || '',
    mfaOperatorRef: partial.mfaOperatorRef || '',
    mfaInductionDate: partial.mfaInductionDate || '',
    inductionStatus: partial.inductionStatus || '',
    shop: partial.shop || '',
    offlogStatus: partial.offlogStatus || '',
    workscopeAgreed: partial.workscopeAgreed || '',
    plannedToTest: partial.plannedToTest || '',
    plannedToArc: partial.plannedToArc || '',
    riskToCustomer: partial.riskToCustomer || '',
    contractInPlace: partial.contractInPlace || '',
    contractType: partial.contractType || '',
    contractRef: partial.contractRef || '',
    fullyFunded: partial.fullyFunded || '',
    paymentTerms: partial.paymentTerms || '',
    mfaInductionDate2: partial.mfaInductionDate2 || '',
    poRequested: partial.poRequested || '',
    customerPoRef: partial.customerPoRef || '',
    networkPaying: partial.networkPaying || '',
    networkInMfa: partial.networkInMfa || '',
    svPrice: partial.svPrice || '',
    profit: partial.profit || '',
    cashOutEligible: partial.cashOutEligible || '',
    cashOutProbability: partial.cashOutProbability ?? null,
    crcsApplicable: partial.crcsApplicable || '',
    backingDataReceived: partial.backingDataReceived || '',
    backingDataSent: partial.backingDataSent || '',
    invoicePayment: partial.invoicePayment || '',
    customerMaster: partial.customerMaster || '',
    addressForCrc: partial.addressForCrc || '',
    crcContact: partial.crcContact || '',
    comments: partial.comments || '',
    taskOwner: partial.taskOwner || '',
    priority: partial.priority || '',
    openActions: partial.openActions || '',
    lastUpdated: partial.lastUpdated || '',
    nextSteps: partial.nextSteps || '',
    _rowIndex: partial._rowIndex || 0,
  };
}

function fillForecastDefaults(partial: Partial<ForecastRecord>): ForecastRecord {
  return {
    lessor: partial.lessor || '',
    lessorCarePlus: partial.lessorCarePlus || '',
    operator: partial.operator || '',
    esn: partial.esn || '',
    engineType: partial.engineType || '',
    wingStatus: partial.wingStatus || '',
    removalDate: partial.removalDate || '',
    comment: partial.comment || '',
    svTypeNeeded: partial.svTypeNeeded || '',
    svPrice: partial.svPrice || '',
    cashOutEligible: partial.cashOutEligible || '',
    profitMillion: partial.profitMillion || '',
    priority: partial.priority || '',
    notes: partial.notes || '',
    _rowIndex: partial._rowIndex || 0,
  };
}

// ============================================================
// Main entry point — combined workbook
// Supports both old format (Full Forecast + 2026 Forecast sheets)
// and new template (Engine Tracker hybrid sheet).
//
// Adapted from V4: takes a Uint8Array | ArrayBuffer directly so this module
// runs in both Node (Vercel Functions) and the browser (Vite). XLSX.read
// with type:"array" accepts both.
// ============================================================
export function parseWorkbook(buffer: Uint8Array | ArrayBuffer): ParsedWorkbook {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetNames = wb.SheetNames;

  // Detect new template: "Engine Tracker" sheet
  const engineTrackerName = sheetNames.find((n) =>
    n.toLowerCase().includes("engine") && n.toLowerCase().includes("tracker"),
  );

  if (engineTrackerName) {
    // New template: Engine Tracker is a hybrid sheet containing both
    // shop-visit and forecast fields. Parse it with both mappings.
    const sheet = wb.Sheets[engineTrackerName];
    const shopVisits = parseFullForecast(sheet);
    const forecasts = parseForecast(sheet);

    // Also parse companion sheets if workbook was split
    // "Near Term Forecasting" contains Slot Planned / Awaiting Detail records
    // "Future Forecast" contains the bulk on-wing fleet with no active SV
    // "Completed" contains finished shop visits
    const companionSheets = sheetNames.filter((n) => {
      const nl = n.toLowerCase();
      return (
        nl.includes("near term") ||
        (nl.includes("future") && nl.includes("forecast")) ||
        nl === "completed"
      );
    });
    for (const companionName of companionSheets) {
      const companionSheet = wb.Sheets[companionName];
      shopVisits.push(...parseFullForecast(companionSheet));
      forecasts.push(...parseForecast(companionSheet));
    }
    return { shopVisits, forecasts };
  }

  // Original format: Full Forecast + 2026 Forecast
  const fullForecastName =
    sheetNames.find((n) => n.toLowerCase().includes("full") && n.toLowerCase().includes("forecast")) ??
    sheetNames[0];

  const forecastName =
    sheetNames.find((n) =>
      n.toLowerCase().includes("2026") ||
      (n.toLowerCase().includes("forecast") && !n.toLowerCase().includes("full")),
    ) ??
    sheetNames[1] ??
    sheetNames[0];

  const shopVisits = parseFullForecast(wb.Sheets[fullForecastName]);
  const forecasts =
    forecastName !== fullForecastName ? parseForecast(wb.Sheets[forecastName]) : [];

  return { shopVisits, forecasts };
}

// ============================================================
// Single-sheet parsers (for separate uploads)
// ============================================================

/** Parse a standalone Shop Visit Excel buffer (uses first sheet) */
export function parseSingleShopSheet(buffer: Uint8Array | ArrayBuffer): ShopVisitRecord[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  return parseFullForecast(wb.Sheets[wb.SheetNames[0]]);
}

/** Parse a standalone Engine Forecast Excel buffer (uses first sheet) */
export function parseSingleForecastSheet(buffer: Uint8Array | ArrayBuffer): ForecastRecord[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  return parseForecast(wb.Sheets[wb.SheetNames[0]]);
}
