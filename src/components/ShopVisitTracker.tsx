import { useState, useMemo } from 'react';
import type { ShopVisitRecord } from '../types';
import KPICard from './KPICard';
import StatusPipeline from './StatusPipeline';
import DataTable from './DataTable';
import EngineDetailPanel from './EngineDetailPanel';
import { computeShopVisitKPIs, computePipelineStages } from '../utils/dataTransforms';

interface ShopVisitTrackerProps {
  data: ShopVisitRecord[];
}

// Column groups with their styling — Updated for light theme
const COLUMN_GROUPS = {
  identity: {
    label: 'Asset Identity',
    color: '#1A2942', // Dark blue text
    bgClass: 'bg-[#F2F4F7]', // Light grey-blue bg
  },
  lease: {
    label: 'Lease & Transition',
    color: '#6B21A8', // Purple text
    bgClass: 'bg-[#FAF5FF]', // Very light purple bg
  },
  sv: {
    label: 'Shop Visit Planning',
    color: '#8E7633', // Gold text
    bgClass: 'bg-[#FDFBF7]', // Very light gold bg
  },
  progress: {
    label: 'SV Progress',
    color: '#92400E', // Amber text
    bgClass: 'bg-[#FFFBEB]', // Very light amber bg
  },
  contract: {
    label: 'Commercial & Contract',
    color: '#475467', // Grey text
    bgClass: 'bg-[#F9FAFB]', // Off-white bg
  },
  financial: {
    label: 'Financial',
    color: '#166534', // Green text
    bgClass: 'bg-[#F0FDF4]', // Very light green bg
  },
  crc: {
    label: "CRC's",
    color: '#1E40AF', // Blue text
    bgClass: 'bg-[#EFF6FF]', // Very light blue bg
  },
  actions: {
    label: 'Ownership & Actions',
    color: '#9F1239', // Rose text
    bgClass: 'bg-[#FFF1F2]', // Very light rose bg
  },
};

// All columns mapped — aligned with Lessor_SV_Tracker_v2 structure
const COLUMNS = [
  // Asset Identity
  { key: 'lessor' as const, label: 'Lessor', group: 'identity', width: 140 },
  { key: 'lessorCarePlus' as const, label: 'TCA / LessorCare+', group: 'identity', width: 120 },
  { key: 'operator' as const, label: 'Operator', group: 'identity', width: 160 },
  { key: 'msn' as const, label: 'MSN', group: 'identity', width: 90 },
  { key: 'aircraftType' as const, label: 'Aircraft Type', group: 'identity', width: 110 },
  { key: 'esn' as const, label: 'ESN', group: 'identity', width: 90 },
  { key: 'engineType' as const, label: 'Engine Type', group: 'identity', width: 100 },
  { key: 'registration' as const, label: 'Registration', group: 'identity', width: 100 },

  // Lease & Transition
  { key: 'leaseExpiry' as const, label: 'Lease Expiry', group: 'lease', width: 110 },
  { key: 'transitionDate' as const, label: 'Transition Date', group: 'lease', width: 120 },
  { key: 'transitionProbability' as const, label: 'Trans. Prob.', group: 'lease', width: 100 },
  { key: 'wingStatus' as const, label: 'Wing Status', group: 'lease', width: 100 },
  { key: 'removalDate' as const, label: 'Removal Date', group: 'lease', width: 110 },
  { key: 'fcsRemaining' as const, label: 'FCs Remaining', group: 'lease', width: 110 },

  // Shop Visit Planning
  { key: 'svProbability' as const, label: 'SV Prob.', group: 'sv', width: 90 },
  { key: 'svType' as const, label: 'SV Type', group: 'sv', width: 90 },
  { key: 'svReason' as const, label: 'SV Reason', group: 'sv', width: 100 },
  { key: 'inductionGate' as const, label: 'Induction Gate', group: 'sv', width: 130 },
  { key: 'dateSvRequested' as const, label: 'Date Requested', group: 'sv', width: 120 },
  { key: 'requiredOutputDate' as const, label: 'Reqd Output', group: 'sv', width: 110 },
  { key: 'mfaOperatorRef' as const, label: 'MfA Ref', group: 'sv', width: 110 },
  { key: 'mfaInductionDate' as const, label: 'MfA Induction', group: 'sv', width: 110 },
  { key: 'inductionStatus' as const, label: 'Induction Status', group: 'sv', width: 120 },

  // SV Progress
  { key: 'offlogStatus' as const, label: 'Offlog Status', group: 'progress', width: 180 },
  { key: 'workscopeAgreed' as const, label: 'Workscope Agreed', group: 'progress', width: 140 },
  { key: 'plannedToTest' as const, label: 'Planned to Test', group: 'progress', width: 120 },
  { key: 'plannedToArc' as const, label: 'Planned to ARC', group: 'progress', width: 120 },
  { key: 'shop' as const, label: 'Overhaul Base', group: 'progress', width: 120 },
  { key: 'status' as const, label: 'Status', group: 'progress', width: 130 },
  { key: 'riskToCustomer' as const, label: 'Risk to Customer', group: 'progress', width: 140 },

  // Commercial & Contract
  { key: 'contractInPlace' as const, label: 'Contract in Place', group: 'contract', width: 120 },
  { key: 'contractType' as const, label: 'Contract Type', group: 'contract', width: 110 },
  { key: 'contractRef' as const, label: 'Contract Ref / DEG', group: 'contract', width: 150 },
  { key: 'paymentTerms' as const, label: 'Payment Terms', group: 'contract', width: 120 },
  { key: 'fullyFunded' as const, label: 'Fully Funded', group: 'contract', width: 130 },
  { key: 'poRequested' as const, label: 'PO Status & Amt', group: 'contract', width: 130 },
  { key: 'customerPoRef' as const, label: 'Customer PO Ref', group: 'contract', width: 130 },
  { key: 'networkPaying' as const, label: 'Network (Payer)', group: 'contract', width: 140 },
  { key: 'networkInMfa' as const, label: 'Network in MfA', group: 'contract', width: 140 },
  { key: 'mfaInductionDate2' as const, label: 'MfA Date 2', group: 'contract', width: 110 },

  // Financial
  { key: 'svPrice' as const, label: 'SV Price ($)', group: 'financial', width: 110 },
  { key: 'totalSvContribution' as const, label: 'SV Contribution', group: 'financial', width: 120 },
  { key: 'profit' as const, label: 'Profit ($)', group: 'financial', width: 100 },
  { key: 'cashOutEligible' as const, label: 'Cash Out Eligible', group: 'financial', width: 120 },
  { key: 'cashOutProbability' as const, label: 'Cash Out Prob.', group: 'financial', width: 110 },

  // CRCs
  { key: 'crcsApplicable' as const, label: 'CRCs Applicable', group: 'crc', width: 120 },
  { key: 'backingDataReceived' as const, label: 'Backing Data Recv', group: 'crc', width: 140 },
  { key: 'backingDataSent' as const, label: 'Backing Data Sent', group: 'crc', width: 140 },
  { key: 'invoicePayment' as const, label: 'Invoice & Payment', group: 'crc', width: 180 },
  { key: 'customerMaster' as const, label: 'Customer Master', group: 'crc', width: 150 },
  { key: 'addressForCrc' as const, label: 'Address for CRC', group: 'crc', width: 160 },
  { key: 'crcContact' as const, label: 'CRC Contact', group: 'crc', width: 140 },

  // Ownership & Actions
  { key: 'amContact' as const, label: 'AM Responsible', group: 'actions', width: 120 },
  { key: 'taskOwner' as const, label: 'Task Owner', group: 'actions', width: 120 },
  { key: 'priority' as const, label: 'Priority', group: 'actions', width: 90 },
  { key: 'openActions' as const, label: 'Open Actions', group: 'actions', width: 200 },
  { key: 'lastUpdated' as const, label: 'Last Updated', group: 'actions', width: 110 },
  { key: 'nextSteps' as const, label: 'Next Steps', group: 'actions', width: 200 },
  { key: 'comments' as const, label: 'Comments', group: 'actions', width: 250 },
];

export default function ShopVisitTracker({ data }: ShopVisitTrackerProps) {
  const kpis = useMemo(() => computeShopVisitKPIs(data), [data]);
  const stages = useMemo(() => computePipelineStages(data), [data]);
  const [selectedEngine, setSelectedEngine] = useState<ShopVisitRecord | null>(null);

  return (
    <div className="animate-fade-in">
      {/* View Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24,
          fontWeight: 600,
          color: "#0F1923",
          lineHeight: 1.2,
          marginBottom: 6,
        }}>Shop Visit Pipeline</h2>
        <p style={{
          fontSize: 13,
          color: "#8B9AB5",
          fontWeight: 500,
        }}>Track the status of engine shop visits from planning through completion</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 stagger-children" style={{ gap: '20px', marginBottom: '40px' }}>
        {kpis.map(kpi => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Pipeline */}
      <StatusPipeline
        stages={stages}
        onEngineClick={(record) => setSelectedEngine(record)}
      />

      {/* Full Data Table */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 18,
          fontWeight: 600,
          color: "#0F1923",
          marginBottom: 16,
        }}>
          Detailed Records
        </h3>
        <DataTable
          data={data}
          columns={COLUMNS}
          columnGroups={COLUMN_GROUPS}
          searchKeys={['lessor', 'operator', 'esn', 'msn', 'shop', 'status', 'comments', 'aircraftType', 'registration']}
          filterKeys={[
            { key: 'engineType', label: 'Engine Type' },
            { key: 'status', label: 'Status' },
            { key: 'shop', label: 'Overhaul Base' },
            { key: 'lessor', label: 'Lessor' },
            { key: 'wingStatus', label: 'Wing Status' },
            { key: 'priority', label: 'Priority' },
          ]}
        />
      </div>

      {/* Engine Detail Drawer */}
      <EngineDetailPanel
        record={selectedEngine}
        isOpen={selectedEngine !== null}
        onClose={() => setSelectedEngine(null)}
      />
    </div>
  );
}
