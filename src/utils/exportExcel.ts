import * as XLSX from 'xlsx';
import type { ShopVisitRecord, ForecastRecord } from '../types';

// ============================================================
// Column order for re-export (matching original Excel structure)
// ============================================================

const SHOP_VISIT_COLUMNS: { key: keyof ShopVisitRecord; header: string }[] = [
    // Asset Identity
    { key: 'lessor', header: 'Lessor' },
    { key: 'lessorCarePlus', header: 'TCA / LessorCare+' },
    { key: 'operator', header: 'Operator' },
    { key: 'msn', header: 'MSN' },
    { key: 'aircraftType', header: 'Aircraft Type' },
    { key: 'esn', header: 'ESN' },
    { key: 'engineType', header: 'Engine Type' },
    { key: 'registration', header: 'Registration' },
    // Lease & Transition
    { key: 'leaseExpiry', header: 'Lease Expiry' },
    { key: 'transitionDate', header: 'Transition Date' },
    { key: 'transitionProbability', header: 'Transition Prob.' },
    { key: 'wingStatus', header: 'On-Wing / Off-Wing' },
    { key: 'removalDate', header: 'Removal Date (Fcst)' },
    { key: 'fcsRemaining', header: 'FCs Remaining' },
    // Shop Visit Planning
    { key: 'svProbability', header: 'SV Probability' },
    { key: 'svType', header: 'SV Type' },
    { key: 'svReason', header: 'SV Reason' },
    { key: 'inductionGate', header: 'Induction Gate' },
    { key: 'dateSvRequested', header: 'Date SV Requested' },
    { key: 'requiredOutputDate', header: 'Reqd Engine Output' },
    { key: 'mfaOperatorRef', header: 'MfA Ref' },
    { key: 'mfaInductionDate', header: 'MfA Induction Date' },
    { key: 'inductionStatus', header: 'Induction Status' },
    // SV Progress
    { key: 'offlogStatus', header: 'Offlog Status' },
    { key: 'workscopeAgreed', header: 'Workscope Agreed' },
    { key: 'plannedToTest', header: 'Planned to Test' },
    { key: 'plannedToArc', header: 'Planned to ARC' },
    { key: 'shop', header: 'Overhaul Base' },
    { key: 'status', header: 'Status' },
    { key: 'riskToCustomer', header: 'Risk to Customer' },
    // Commercial & Contract
    { key: 'contractInPlace', header: 'Contract in Place' },
    { key: 'contractType', header: 'Contract Type' },
    { key: 'contractRef', header: 'Contract Ref / DEG' },
    { key: 'paymentTerms', header: 'Payment Terms' },
    { key: 'fullyFunded', header: 'Fully Funded' },
    { key: 'poRequested', header: 'PO Status & Amt' },
    { key: 'customerPoRef', header: 'Customer PO Ref' },
    { key: 'networkPaying', header: 'Network (Payer)' },
    { key: 'networkInMfa', header: 'Network in MfA Work Order' },
    { key: 'mfaInductionDate2', header: 'MfA Induction Date 2' },
    // Financial
    { key: 'svPrice', header: 'SV Price ($)' },
    { key: 'totalSvContribution', header: 'Total SV Contribution' },
    { key: 'profit', header: 'Profit ($)' },
    { key: 'cashOutEligible', header: 'Cash Out Eligible' },
    { key: 'cashOutProbability', header: 'Cash Out Prob.' },
    // CRCs
    { key: 'crcsApplicable', header: "CRC's Applicable?" },
    { key: 'backingDataReceived', header: 'Backing Data Received?' },
    { key: 'backingDataSent', header: 'Backing Data Sent to Customer?' },
    { key: 'invoicePayment', header: 'Invoice No and Payment Date' },
    { key: 'customerMaster', header: 'Customer Master' },
    { key: 'addressForCrc', header: 'Address for CRC Team' },
    { key: 'crcContact', header: 'CRC Contact Person' },
    // Ownership & Actions
    { key: 'amContact', header: 'AM Responsible' },
    { key: 'taskOwner', header: 'Task Owner' },
    { key: 'priority', header: 'Priority' },
    { key: 'openActions', header: 'Open Actions / Issues' },
    { key: 'lastUpdated', header: 'Last Updated' },
    { key: 'nextSteps', header: 'Next Steps' },
    { key: 'comments', header: 'Comments' },
];

const FORECAST_COLUMNS: { key: keyof ForecastRecord; header: string }[] = [
    { key: 'lessor', header: 'Lessor' },
    { key: 'lessorCarePlus', header: 'LessorCare+?' },
    { key: 'operator', header: 'Operator' },
    { key: 'esn', header: 'ESN/MSN' },
    { key: 'engineType', header: 'Engine Type' },
    { key: 'wingStatus', header: 'On-Wing/Off-Wing' },
    { key: 'removalDate', header: 'Removal Date' },
    { key: 'comment', header: 'Comment' },
    { key: 'svTypeNeeded', header: 'Type of SV Needed' },
    { key: 'svPrice', header: 'SV Price' },
    { key: 'cashOutEligible', header: 'Cash Out Eligible?' },
    { key: 'profitMillion', header: 'Profit $M' },
    { key: 'priority', header: 'Priority' },
    { key: 'notes', header: 'Notes' },
];

function recordsToAoA<T extends Record<string, any>>(
    records: T[],
    columns: { key: keyof T; header: string }[]
): any[][] {
    const headers = columns.map(c => c.header);
    const rows = records.map(r => columns.map(c => {
        const val = r[c.key];
        if (val === null || val === undefined) return '';
        return val;
    }));
    return [headers, ...rows];
}

/**
 * Export shop visit + forecast data back to an .xlsx file and trigger download.
 */
export function exportWorkbook(
    shopVisits: ShopVisitRecord[],
    forecasts: ForecastRecord[],
    filename = 'RR_Engine_Data_Export.xlsx'
): void {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Full Forecast (Shop Visits)
    const svData = recordsToAoA(shopVisits, SHOP_VISIT_COLUMNS);
    const svSheet = XLSX.utils.aoa_to_sheet(svData);
    XLSX.utils.book_append_sheet(wb, svSheet, 'Full Forecast');

    // Sheet 2: 2026 Forecast
    if (forecasts.length > 0) {
        const fcData = recordsToAoA(forecasts, FORECAST_COLUMNS);
        const fcSheet = XLSX.utils.aoa_to_sheet(fcData);
        XLSX.utils.book_append_sheet(wb, fcSheet, '2026 Forecast');
    }

    // Trigger download
    XLSX.writeFile(wb, filename);
}
