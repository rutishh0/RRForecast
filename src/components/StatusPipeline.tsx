import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { PipelineStage, ShopVisitRecord } from '../types';

interface StatusPipelineProps {
  stages: PipelineStage[];
  onEngineClick?: (record: ShopVisitRecord) => void;
}

export default function StatusPipeline({ stages, onEngineClick }: StatusPipelineProps) {
  const [expandGroup1, setExpandGroup1] = useState(false);
  const [expandGroup2, setExpandGroup2] = useState(false);

  const renderStage = (label: string) => {
    const stage = stages.find(s => s.label === label);
    if (!stage) return null;

    return (
      <div
        key={stage.id}
        className="flex-shrink-0 w-[220px] min-h-[160px] flex flex-col"
      >
        {/* Stage header */}
        <div
          className="flex items-center justify-between px-3.5 py-2.5 rounded-t-xl border border-b-0 border-rr-border bg-[#F6F5F2]"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rr-text">
              {stage.label}
            </span>
          </div>
          <span
            className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-white border border-rr-border shadow-sm"
            style={{ color: stage.color }}
          >
            {stage.records.length}
          </span>
        </div>

        {/* Cards container */}
        <div className="flex flex-col gap-2.5 p-3 rounded-b-xl border border-rr-border bg-[#F8F7F5] flex-1 overflow-y-auto custom-scrollbar">
          {stage.records.length === 0 ? (
            <div className="flex items-center justify-center h-[100px] text-[12px] font-medium text-rr-text-muted">
              No items
            </div>
          ) : (
            stage.records.slice(0, 20).map((r, i) => (
              <div
                key={`${r.esn}-${i}`}
                onClick={() => onEngineClick?.(r)}
                className={`p-3 rounded-lg bg-white border border-rr-border shadow-sm
                  transition-all duration-200 group
                  ${onEngineClick
                    ? 'cursor-pointer hover:border-rr-gold/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:-translate-y-[1px]'
                    : 'cursor-default'
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[12px] font-bold text-rr-navy leading-tight truncate pr-2">
                    {r.operator || r.lessor || 'Unknown'}
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rr-bg-secondary text-rr-text-dim border border-rr-border shrink-0">
                    {r.engineType || '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-rr-text-muted">ESN</span>
                    <span className="font-medium text-rr-text">{r.esn || '—'}</span>
                  </div>

                  {r.removalDate && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-rr-text-muted">Removal</span>
                      <span className="font-medium text-rr-text">{r.removalDate}</span>
                    </div>
                  )}

                  {r.shop && (
                    <div className="flex justify-between items-center text-[11px] mt-1 pt-1 border-t border-rr-border border-dashed">
                      <span className="text-rr-text-muted">Shop</span>
                      <span className="font-medium text-rr-gold">{r.shop}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {stage.records.length > 20 && (
            <div className="text-center text-[11px] font-medium text-rr-text-muted py-2">
              +{stage.records.length - 20} more
            </div>
          )}
        </div>
      </div>
    );
  };

  const ExpandButton = ({ isExpanded, onClick }: { isExpanded: boolean, onClick: () => void }) => (
    <div className="flex flex-col items-center justify-center px-1">
      <button
        onClick={onClick}
        className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:border-rr-gold hover:text-rr-gold text-gray-400 transition-all hover:scale-110 shrink-0"
        title={isExpanded ? "Collapse" : "Expand"}
      >
        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
    </div>
  );

  return (
    <div
      className="rr-card flex flex-col mb-6"
      style={{
        padding: '24px',
        resize: 'vertical',
        overflow: 'hidden',
        minHeight: '350px',
        height: '400px', // Initial height
        maxHeight: '1000px',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[18px] font-semibold font-[family-name:var(--font-heading)] text-rr-navy">
          Shop Visit Pipeline
        </h3>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar flex-1 items-stretch">
        {renderStage('Forecasted')}

        <ExpandButton isExpanded={expandGroup1} onClick={() => setExpandGroup1(!expandGroup1)} />

        {expandGroup1 && (
          <>
            {renderStage('Requested')}
            {renderStage('Workscope Agreed')}
          </>
        )}

        {renderStage('In Shop')}

        <ExpandButton isExpanded={expandGroup2} onClick={() => setExpandGroup2(!expandGroup2)} />

        {expandGroup2 && (
          <>
            {renderStage('Testing')}
            {renderStage('ARC')}
          </>
        )}

        {renderStage('Complete')}
        {renderStage('On Hold')}
      </div>
    </div>
  );
}
