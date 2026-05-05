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
  'on-wing / off-wing': 'wingStatus',
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
  'on-wing / off-wing': 'wingStatus',
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

/**
 * Convert an Excel serial date (days since 1900-01-00, with the 1900 leap-year
 * bug Excel preserved for compat with Lotus 123) to an ISO yyyy-mm-dd string.
 * 25569 = days between Excel's 1900-01-00 epoch and Unix's 1970-01-01.
 */
function excelSerialToISO(serial: number): string {
  if (!Number.isFinite(serial)) return String(serial);
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return String(serial);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Safely coerce a cell value to string. Numeric Excel dates → ISO yyyy-mm-dd. */
function cellStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    // Excel date serial range covers ~1909-09-12 (3500) through ~2173-10-14 (100000).
    // Most operational dates are 30000-80000 (1982-2118). Dates use ISO format so
    // `new Date(value)` parses correctly downstream (charts, heatmaps, sorting).
    if (val > 30000 && val < 80000 && Number.isFinite(val) && val % 1 === 0) {
      return excelSerialToISO(val);
    }
    return String(val);
  }
  // Some xlsx Date objects sneak in when cellDates is true elsewhere — handle generically.
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
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

/**
 * Coerce a probability/percentage cell to a 0-100 number.
 * Excel's percent format stores 100% as 1.0; the source workbook uses
 * fractions throughout, so anything ≤1.5 is treated as a fraction and scaled.
 * Values >1.5 are assumed already in 0-100 form (e.g., "85" or "85%").
 */
function cellPct(val: unknown): number | null {
  const n = cellNum(val);
  if (n == null) return null;
  return n <= 1.5 ? Math.round(n * 1000) / 10 : n;
}

/**
 * Quick ESN sanity check — pivot tables and section dividers embedded in
 * Future Forecast / Reference sheets put non-ESN strings in column F.
 * Real ESNs are 4-7 alphanumeric chars (typically 5 numeric).
 */
function looksLikeEsn(esn: string): boolean {
  if (!esn) return false;
  const trimmed = esn.trim();
  if (!/^[A-Z0-9][A-Z0-9\-/]{2,15}$/i.test(trimmed) || /\s/.test(trimmed)) return false;
  // Reject 4-digit year-like values (pivot section dividers in Future Forecast).
  if (/^\d{4}$/.test(trimmed)) {
    const n = parseInt(trimmed, 10);
    if (n >= 1900 && n <= 2100) return false;
  }
  return true;
}

/** Engine type column should hold a Trent family. Reject pivot-table junk values. */
function looksLikeTrentFamily(et: string): boolean {
  if (!et) return true; // Empty acceptable — row may be pre-data-entry
  return /^Trent[\s/-]/i.test(et.trim());
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

/**
 * Build column mapping from header row.
 *
 * Two-pass logic:
 *   Pass 1: exact case-insensitive match against colMap.
 *   Pass 2: substring fallback for headers that didn't exact-match — but
 *           ONLY for record keys (target fields) that no column already
 *           claimed in pass 1.
 *
 * The two-pass split avoids a real bug where, e.g., "Lessor" exact-matches
 * col A → key=lessor, but then "TCA / LessorCare+" substring-matches col B
 * → key=lessor too (because "tca / lessorcare+" contains "lessor"). Without
 * the guard, both columns get mapped to the same target key, and the row
 * loop overwrites the real value with whatever's in the partial-match
 * column (usually empty).
 */
function buildColMapping<T>(
  sheet: XLSX.WorkSheet,
  headerRow: number,
  colMap: Record<string, keyof T>
): Map<number, keyof T> {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const mapping = new Map<number, keyof T>();
  const claimedKeys = new Set<keyof T>();

  function readHeader(c: number): string | null {
    const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c })];
    if (!cell) return null;
    return String(cell.v ?? '')
      .toLowerCase()
      .trim()
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ');
  }

  // Pass 1 — exact matches.
  for (let c = range.s.c; c <= range.e.c; c++) {
    const header = readHeader(c);
    if (!header) continue;
    const key = colMap[header];
    if (key && !claimedKeys.has(key)) {
      mapping.set(c, key);
      claimedKeys.add(key);
    }
  }

  // Pass 2 — substring fallback. Skip columns already mapped and target keys
  // already claimed by an exact match.
  for (let c = range.s.c; c <= range.e.c; c++) {
    if (mapping.has(c)) continue;
    const header = readHeader(c);
    if (!header) continue;
    for (const [pattern, key] of Object.entries(colMap)) {
      const k = key as keyof T;
      if (claimedKeys.has(k)) continue;
      if (header.includes(pattern) || pattern.includes(header)) {
        mapping.set(c, k);
        claimedKeys.add(k);
        break;
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

  let dataStarted = false;
  let consecutiveEmpty = 0;

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const row: Partial<ShopVisitRecord> = { _rowIndex: r };

    for (const [c, key] of mapping.entries()) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      const val = cell ? cell.v : null;

      if (key === 'transitionProbability' || key === 'svProbability' || key === 'cashOutProbability') {
        (row as any)[key] = cellPct(val);
      } else if (key === 'totalSvContribution') {
        (row as any)[key] = cellNum(val);
      } else {
        (row as any)[key] = cellStr(val);
      }
    }

    // Empty-row + end-of-data detection. A pivot/summary section after the
    // main data block typically has 1-2 blank rows before it; bail when we
    // see two empties in a row after data has started.
    const isEmpty = !row.lessor && !row.operator && !row.esn;
    if (isEmpty) {
      if (dataStarted) {
        consecutiveEmpty++;
        if (consecutiveEmpty >= 2) break;
      }
      continue;
    }
    consecutiveEmpty = 0;

    // Skip rows whose ESN column doesn't hold an ESN-shaped value — these are
    // section dividers (year labels, pivot titles, lessor totals) embedded in
    // Future Forecast and similar sheets.
    if (!looksLikeEsn((row.esn || '').toString())) continue;
    // Filter pivot-table rows where engineType column holds a non-Trent value
    // (lessor names, wing-state values, year labels, summary titles).
    if (!looksLikeTrentFamily((row.engineType || '').toString())) continue;

    dataStarted = true;
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

  let dataStarted = false;
  let consecutiveEmpty = 0;

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const row: Partial<ForecastRecord> = { _rowIndex: r };

    for (const [c, key] of mapping.entries()) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      const val = cell ? cell.v : null;
      (row as any)[key] = cellStr(val);
    }

    const isEmpty = !row.lessor && !row.operator && !row.esn;
    if (isEmpty) {
      if (dataStarted) {
        consecutiveEmpty++;
        if (consecutiveEmpty >= 2) break;
      }
      continue;
    }
    consecutiveEmpty = 0;

    if (!looksLikeEsn((row.esn || '').toString())) continue;
    if (!looksLikeTrentFamily((row.engineType || '').toString())) continue;

    dataStarted = true;
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
  const lower = (n: string) => n.toLowerCase();

  // Three named sheets in the V8.5 template (and predecessors):
  //   - "Engine SV Tracker"  → active shop visits in the pipeline
  //   - "Future Forecast"    → predicted future removals (forecast-only)
  //   - "Completed"          → historical completed SVs (status forced to "Complete")
  // Additional/older formats fall through to the legacy two-sheet logic at the bottom.
  const trackerName = sheetNames.find(
    (n) => lower(n).includes("engine") && lower(n).includes("tracker"),
  );
  const futureName = sheetNames.find(
    (n) => lower(n).includes("future") && lower(n).includes("forecast"),
  );
  const completedName = sheetNames.find((n) => lower(n) === "completed");
  const nearTermName = sheetNames.find((n) => lower(n).includes("near term"));

  if (trackerName || futureName || completedName) {
    const shopVisits: ShopVisitRecord[] = [];
    const forecasts: ForecastRecord[] = [];

    if (trackerName) {
      shopVisits.push(...parseFullForecast(wb.Sheets[trackerName]));
    }
    if (nearTermName) {
      shopVisits.push(...parseFullForecast(wb.Sheets[nearTermName]));
    }
    if (completedName) {
      const completed = parseFullForecast(wb.Sheets[completedName]).map((r) => ({
        ...r,
        // Force status to "Complete" — these rows are historical regardless of
        // whatever induction-status column happened to say in the source sheet.
        status: r.status && r.status.toLowerCase().includes("complete") ? r.status : "Complete",
      }));
      shopVisits.push(...completed);
    }
    if (futureName) {
      forecasts.push(...parseForecast(wb.Sheets[futureName]));
    }

    return { shopVisits, forecasts };
  }

  // Legacy two-sheet format (Full Forecast + 2026 Forecast) — used by V4 fixtures
  // and the lv_fake.xlsx test file. Single hybrid sheet with both mappings applied.
  const fullForecastName =
    sheetNames.find((n) => lower(n).includes("full") && lower(n).includes("forecast")) ??
    sheetNames[0];

  const forecastName =
    sheetNames.find(
      (n) =>
        lower(n).includes("2026") ||
        (lower(n).includes("forecast") && !lower(n).includes("full")),
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
