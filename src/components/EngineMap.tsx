import { useState, useMemo, useCallback, useRef } from 'react';
import type { ShopVisitRecord, MROFacility, MROFacilityType } from '../types';
import { X, MapPin, Wrench, Plane } from 'lucide-react';

// ================================================================
// MRO Facility Database — real Rolls-Royce network locations
// ================================================================
const MRO_FACILITIES: MROFacility[] = [
    { name: 'Rolls-Royce Derby', city: 'Derby', country: 'United Kingdom', lat: 52.91, lon: -1.47, type: 'rr-maintenance' },
    { name: 'N3 Engine Overhaul', city: 'Arnstadt', country: 'Germany', lat: 50.84, lon: 10.95, type: 'rr-maintenance' },
    { name: 'EOS', city: 'Dahlewitz', country: 'Germany', lat: 52.36, lon: 13.53, type: 'rr-maintenance' },
    { name: 'HAESL', city: 'Hong Kong', country: 'China', lat: 22.31, lon: 113.94, type: 'authorised-jv' },
    { name: 'SAESL', city: 'Singapore', country: 'Singapore', lat: 1.36, lon: 103.99, type: 'authorised-jv' },
    { name: 'Sanad Aerotech', city: 'Abu Dhabi', country: 'UAE', lat: 24.42, lon: 54.65, type: 'authorised-jv' },
    { name: 'IHI Corporation', city: 'Tokyo', country: 'Japan', lat: 35.73, lon: 139.78, type: 'customer-owned' },
    { name: 'Delta TechOps', city: 'Atlanta', country: 'United States', lat: 33.64, lon: -84.43, type: 'customer-owned' },
    { name: 'Turkish Technic', city: 'Istanbul', country: 'Turkey', lat: 40.98, lon: 28.81, type: 'customer-owned' },
    { name: 'Air France Industries', city: 'Paris', country: 'France', lat: 49.01, lon: 2.55, type: 'authorised-independent' },
    { name: 'MRO Malaysia', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.74, lon: 101.70, type: 'authorised-independent' },
];

// ================================================================
// How the "shop" field in the Excel maps to MRO names
// ================================================================
const SHOP_NAME_MAP: Record<string, string> = {
    'n3': 'N3 Engine Overhaul',
    'haesl': 'HAESL',
    'eos': 'EOS',
    'sanad': 'Sanad Aerotech',
    'saesl': 'SAESL',
    'ihi': 'IHI Corporation',
    'delta': 'Delta TechOps',
    'delta techops': 'Delta TechOps',
    'turkish': 'Turkish Technic',
    'turkish technic': 'Turkish Technic',
    'air france': 'Air France Industries',
    'afi': 'Air France Industries',
    'mro malaysia': 'MRO Malaysia',
    'rolls-royce': 'Rolls-Royce Derby',
    'derby': 'Rolls-Royce Derby',
};

// ================================================================
// Visual config per facility type - Updated for light theme
// ================================================================
const FACILITY_TYPE_CONFIG: Record<MROFacilityType, { label: string; color: string; dotClass: string; bgHex: string }> = {
    'rr-maintenance': { label: 'RR Maintenance Facilities', color: '#3B82F6', dotClass: 'bg-blue-500', bgHex: '#EFF6FF' }, // Vivid Blue
    'authorised-jv': { label: 'Authorised Maintenance Centres (JV)', color: '#F59E0B', dotClass: 'bg-amber-500', bgHex: '#FEF3C7' }, // Amber
    'authorised-independent': { label: 'Authorised Maintenance Centres (Ind.)', color: '#A855F7', dotClass: 'bg-purple-500', bgHex: '#FAF5FF' }, // Bright Purple
    'customer-owned': { label: 'Customer-owned Shops', color: '#10B981', dotClass: 'bg-emerald-500', bgHex: '#ECFDF5' }, // Emerald
};

// ================================================================
// Component
// ================================================================
interface EngineMapProps {
    shopVisits: ShopVisitRecord[];
}

export default function EngineMap({ shopVisits }: EngineMapProps) {
    const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
    const [popoverPos, setPopoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const mapRef = useRef<HTMLDivElement>(null);

    // Map shop visit records to MRO facilities
    const facilityEngines = useMemo(() => {
        const map: Record<string, ShopVisitRecord[]> = {};
        MRO_FACILITIES.forEach(f => { map[f.name] = []; });

        shopVisits.forEach(sv => {
            const shopRaw = (sv.shop || '').trim().toLowerCase();
            if (!shopRaw) return;
            const facilityName = SHOP_NAME_MAP[shopRaw];
            if (facilityName && map[facilityName]) {
                map[facilityName].push(sv);
            }
        });
        return map;
    }, [shopVisits]);

    const totalAssigned = useMemo(() => {
        return Object.values(facilityEngines).reduce((sum, arr) => sum + arr.length, 0);
    }, [facilityEngines]);

    const handleMarkerClick = useCallback((facilityName: string, event: React.MouseEvent) => {
        if (selectedFacility === facilityName) {
            setSelectedFacility(null);
            return;
        }
        const rect = mapRef.current?.getBoundingClientRect();
        if (rect) {
            setPopoverPos({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            });
        }
        setSelectedFacility(facilityName);
    }, [selectedFacility]);

    const selectedMRO = MRO_FACILITIES.find(f => f.name === selectedFacility);
    const selectedEngines = selectedFacility ? facilityEngines[selectedFacility] || [] : [];

    // Convert lat/lon to percentage positions for the CSS overlay
    function latLonToPercent(lat: number, lon: number): { left: string; top: string } {
        const svgMinX = 30.767;
        const svgMinY = 241.591;
        const svgWidth = 784.077;
        const svgHeight = 458.627;

        const lonMin = -169;
        const lonMax = 191;
        const latMax = 83;
        const latMin = -56;

        const x = svgMinX + ((lon - lonMin) / (lonMax - lonMin)) * svgWidth;
        const y = svgMinY + ((latMax - lat) / (latMax - latMin)) * svgHeight;

        // Convert SVG coords to percentages of viewBox
        const leftPct = ((x - svgMinX) / svgWidth) * 100;
        const topPct = ((y - svgMinY) / svgHeight) * 100;

        return { left: `${leftPct}%`, top: `${topPct}%` };
    }

    return (
        <div className="animate-fade-in h-full flex flex-col max-w-[1600px] mx-auto min-h-[max(600px,calc(100vh-180px))]">
            {/* View Header */}
            <div className="mb-6">
                <h2 className="text-[28px] font-semibold font-[family-name:var(--font-heading)] text-rr-navy tracking-tight">
                    Global MRO Network
                </h2>
                <p className="text-[13px] text-rr-text-muted mt-1 font-medium">
                    Geographical overview of engine assignments across all maintenance facilities
                </p>
            </div>

            {/* Summary strip */}
            <div className="flex items-center gap-6 mb-6">
                <div className="bg-white border border-rr-border rounded-xl shadow-sm px-6 py-4 flex items-center gap-4 flex-1 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <MapPin size={20} className="text-[#1E40AF]" />
                    </div>
                    <div>
                        <p className="text-[11px] text-rr-text-muted font-bold uppercase tracking-[1px] mb-0.5">Total Facilities</p>
                        <p className="text-[24px] font-bold font-[family-name:var(--font-heading)] text-rr-navy leading-none">{MRO_FACILITIES.length}</p>
                    </div>
                </div>
                <div className="bg-white border border-rr-border rounded-xl shadow-sm px-6 py-4 flex items-center gap-4 flex-1 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-rr-bg-secondary flex items-center justify-center">
                        <Wrench size={20} className="text-rr-text-dim" />
                    </div>
                    <div>
                        <p className="text-[11px] text-rr-text-muted font-bold uppercase tracking-[1px] mb-0.5">Active Shops</p>
                        <p className="text-[24px] font-bold font-[family-name:var(--font-heading)] text-rr-navy leading-none">
                            {Object.values(facilityEngines).filter(arr => arr.length > 0).length}
                        </p>
                    </div>
                </div>
                <div className="bg-white border border-rr-border rounded-xl shadow-sm px-6 py-4 flex items-center gap-4 flex-1 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                        <Plane size={20} className="text-[#B5723B]" />
                    </div>
                    <div>
                        <p className="text-[11px] text-rr-text-muted font-bold uppercase tracking-[1px] mb-0.5">Engines Inducted</p>
                        <p className="text-[24px] font-bold font-[family-name:var(--font-heading)] text-rr-navy leading-none">{totalAssigned}</p>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div
                ref={mapRef}
                className="relative flex-1 bg-[#F9FAFB] border border-rr-border rounded-xl shadow-inner overflow-hidden flex items-center justify-center isolate"
            >
                {/* Single container: background map + markers share the same box */}
                <div
                    className="relative w-full max-w-[1200px]"
                    style={{
                        aspectRatio: '784.077 / 458.627',
                        backgroundImage: 'url(/world-map.min.svg)',
                        backgroundSize: '100% 100%',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.6, // Lighten the map for light theme
                        filter: 'grayscale(60%) sepia(20%) hue-rotate(180deg) brightness(1.2)' // Adjust SVG colors to fit light blue/grey theme
                    }}
                >
                    {/* Dark overlay to theme the map - Removed/Adjusted for light theme */}
                    <div
                        className="absolute inset-0 pointer-events-none mix-blend-multiply"
                        style={{ backgroundColor: 'rgba(238, 242, 246, 0.4)' }} // Light slate blue multiplying
                    />

                    {/* MRO Facility Markers */}
                    {MRO_FACILITIES.map(facility => {
                        const pos = latLonToPercent(facility.lat, facility.lon);
                        const config = FACILITY_TYPE_CONFIG[facility.type];
                        const engines = facilityEngines[facility.name] || [];
                        const hasEngines = engines.length > 0;
                        const isSelected = selectedFacility === facility.name;

                        return (
                            <div
                                key={facility.name}
                                className="absolute"
                                style={{
                                    left: pos.left,
                                    top: pos.top,
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: isSelected ? 30 : hasEngines ? 20 : 10,
                                }}
                            >
                                {/* Pulse ring */}
                                {hasEngines && (
                                    <div
                                        className="absolute rounded-full animate-ping"
                                        style={{
                                            width: 28,
                                            height: 28,
                                            top: '50%', left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            backgroundColor: config.color,
                                            opacity: 0.15,
                                            animationDuration: '3s',
                                        }}
                                    />
                                )}

                                {/* Selected ring */}
                                {isSelected && (
                                    <div
                                        className="absolute rounded-full"
                                        style={{
                                            width: 32,
                                            height: 32,
                                            top: '50%', left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            backgroundColor: config.color,
                                            opacity: 0.1,
                                        }}
                                    />
                                )}

                                {/* Dot */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkerClick(facility.name, e);
                                    }}
                                    className="relative rounded-full shadow-md cursor-pointer transition-all duration-200 hover:scale-125"
                                    style={{
                                        width: hasEngines ? 20 : 14,
                                        height: hasEngines ? 20 : 14,
                                        backgroundColor: config.color,
                                        border: '3px solid #FFFFFF',
                                        boxShadow: `0 2px 8px ${config.color}60`,
                                        opacity: hasEngines || isSelected ? 1 : 0.7,
                                    }}
                                    title={`${facility.name} — ${facility.city}`}
                                />

                                {/* Engine count badge */}
                                {hasEngines && (
                                    <div
                                        className="absolute flex items-center justify-center rounded-md text-[10px] font-bold pointer-events-none"
                                        style={{
                                            top: -18,
                                            left: 12,
                                            minWidth: 20,
                                            height: 18,
                                            padding: '0 5px',
                                            backgroundColor: '#FFFFFF',
                                            color: config.color,
                                            border: `1px solid ${config.color}80`,
                                            boxShadow: `0 4px 12px ${config.color}20`,
                                        }}
                                    >
                                        {engines.length}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="absolute bottom-6 left-6 bg-white border border-rr-border rounded-xl px-5 py-4 z-20 shadow-lg">
                    <p className="text-[10px] font-bold text-rr-text-muted uppercase tracking-[1.5px] mb-3">
                        Facility Network
                    </p>
                    <div className="flex flex-col gap-2.5">
                        {Object.entries(FACILITY_TYPE_CONFIG).map(([type, config]) => (
                            <div key={type} className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10 shadow-sm"
                                    style={{ backgroundColor: config.color }}
                                />
                                <span className="text-[12px] font-semibold text-rr-text-dim whitespace-nowrap">
                                    {config.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Facility Detail Popover */}
                {selectedMRO && (
                    <div
                        className="absolute z-50 w-[380px] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-rr-border"
                        style={{
                            left: Math.min(popoverPos.x + 12, (mapRef.current?.offsetWidth || 800) - 400),
                            top: Math.max(popoverPos.y - 60, 12),
                            animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-rr-border bg-[#FAFAF8] rounded-t-xl">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-white border shadow-sm"
                                    style={{ borderColor: `${FACILITY_TYPE_CONFIG[selectedMRO.type].color}30` }}
                                >
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: FACILITY_TYPE_CONFIG[selectedMRO.type].color }} />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold font-[family-name:var(--font-heading)] text-rr-navy leading-tight">{selectedMRO.name}</h3>
                                    <p className="text-[11px] font-medium text-rr-text-muted mt-0.5">
                                        {selectedMRO.city}, {selectedMRO.country}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedFacility(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white border border-transparent shadow-sm hover:border-rr-border transition-all"
                            >
                                <X size={14} className="text-rr-text-muted hover:text-rr-text" />
                            </button>
                        </div>

                        {/* Type badge */}
                        <div className="px-5 pt-3 pb-2 bg-white">
                            <span
                                className="inline-block text-[10px] uppercase font-bold tracking-[1px] px-2.5 py-1 rounded-md"
                                style={{
                                    backgroundColor: FACILITY_TYPE_CONFIG[selectedMRO.type].bgHex,
                                    color: FACILITY_TYPE_CONFIG[selectedMRO.type].color,
                                    border: `1px solid ${FACILITY_TYPE_CONFIG[selectedMRO.type].color}40`,
                                }}
                            >
                                {FACILITY_TYPE_CONFIG[selectedMRO.type].label}
                            </span>
                        </div>

                        {/* Engine list */}
                        <div className="px-5 py-3 pb-4">
                            {selectedEngines.length === 0 ? (
                                <div className="py-6 text-center border border-dashed border-rr-border rounded-lg bg-[#FAFAF8]">
                                    <p className="text-[13px] font-medium text-rr-text-dim">
                                        No engines currently at this facility
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-3 border-b border-rr-border pb-2">
                                        <span className="text-[10px] font-bold text-rr-text-muted uppercase tracking-[1px]">
                                            Assigned Engines
                                        </span>
                                        <span className="text-[11px] font-bold text-rr-navy bg-[#F2F4F7] px-2 py-0.5 rounded-md border border-rr-border">
                                            Total: {selectedEngines.length}
                                        </span>
                                    </div>
                                    <div className="max-h-[260px] overflow-auto space-y-2 pr-1 custom-scrollbar">
                                        {selectedEngines.map((engine, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white border border-rr-border hover:border-rr-navy/30 hover:shadow-sm transition-all group"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rr-gold mt-1.5" />
                                                    <div>
                                                        <span className="text-[13px] font-bold text-rr-navy font-mono group-hover:text-rr-gold transition-colors">
                                                            {engine.esn || '—'}
                                                        </span>
                                                        <p className="text-[11px] font-medium text-[#667085] mt-0.5 max-w-[130px] truncate" title={engine.operator || engine.lessor || ''}>
                                                            {engine.operator || engine.lessor || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border border-rr-border bg-[#F9FAFB] text-[#475467] uppercase tracking-wider">
                                                        {engine.engineType || '—'}
                                                    </span>
                                                    {engine.status && (
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1  ${engine.status.toLowerCase().includes('complet') ? 'text-[#059669]' :
                                                            engine.status.toLowerCase().includes('hold') ? 'text-[#DC2626]' :
                                                                engine.status.toLowerCase().includes('induct') ? 'text-[#D97706]' :
                                                                    'text-[#2563EB]'
                                                            }`}>
                                                            {engine.status}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Click-to-dismiss overlay when popover is open */}
                {selectedFacility && (
                    <div
                        className="absolute inset-0 z-40 bg-white/10 backdrop-blur-[1px]"
                        onClick={() => setSelectedFacility(null)}
                    />
                )}
            </div>
        </div>
    );
}
