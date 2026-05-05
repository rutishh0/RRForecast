// V5/src/lib/beta/operator-hubs.ts
//
// Lookup table mapping common airline / operator names to their primary
// hub city + lat/lng coordinates. Used by OperatorMap to plot engines
// on a world map. Names matched case-insensitively + with light fuzzy
// matching (substring) so minor naming variations still work.
//
// Coverage: ~50 of the largest Trent operators. Engines whose operator
// isn't matched are simply omitted from the map (they still appear in
// the engines/forecast tables).

export interface OperatorHub {
  city: string;
  country: string;
  /** [latitude, longitude] — WGS84. */
  coords: [number, number];
}

export const OPERATOR_HUBS: Record<string, OperatorHub> = {
  // North America
  "Air Canada": { city: "Toronto", country: "Canada", coords: [43.6777, -79.6248] },
  "Air Transat": { city: "Montreal", country: "Canada", coords: [45.4706, -73.7408] },
  "Delta Air Lines": { city: "Atlanta", country: "USA", coords: [33.6407, -84.4277] },
  "American Airlines": { city: "Dallas", country: "USA", coords: [32.8998, -97.0403] },
  "United Airlines": { city: "Chicago", country: "USA", coords: [41.9742, -87.9073] },
  "Hawaiian Airlines": { city: "Honolulu", country: "USA", coords: [21.3245, -157.9251] },
  // Europe
  "British Airways": { city: "London", country: "UK", coords: [51.4700, -0.4543] },
  "Lufthansa": { city: "Frankfurt", country: "Germany", coords: [50.0379, 8.5622] },
  "Air France": { city: "Paris", country: "France", coords: [49.0097, 2.5479] },
  "KLM": { city: "Amsterdam", country: "Netherlands", coords: [52.3105, 4.7683] },
  "Virgin Atlantic": { city: "London", country: "UK", coords: [51.4700, -0.4543] },
  "Aer Lingus": { city: "Dublin", country: "Ireland", coords: [53.4264, -6.2499] },
  "Iberia": { city: "Madrid", country: "Spain", coords: [40.4983, -3.5676] },
  "TAP Air Portugal": { city: "Lisbon", country: "Portugal", coords: [38.7813, -9.1359] },
  "Norwegian": { city: "Oslo", country: "Norway", coords: [60.1939, 11.1004] },
  "SAS": { city: "Stockholm", country: "Sweden", coords: [59.6519, 17.9186] },
  "Finnair": { city: "Helsinki", country: "Finland", coords: [60.3172, 24.9633] },
  "Swiss": { city: "Zurich", country: "Switzerland", coords: [47.4647, 8.5492] },
  "Austrian Airlines": { city: "Vienna", country: "Austria", coords: [48.1102, 16.5697] },
  "ITA Airways": { city: "Rome", country: "Italy", coords: [41.8003, 12.2389] },
  "Turkish Airlines": { city: "Istanbul", country: "Turkey", coords: [41.2753, 28.7519] },
  // Middle East
  "Emirates": { city: "Dubai", country: "UAE", coords: [25.2532, 55.3657] },
  "Etihad Airways": { city: "Abu Dhabi", country: "UAE", coords: [24.4330, 54.6511] },
  "Qatar Airways": { city: "Doha", country: "Qatar", coords: [25.2611, 51.6138] },
  "Saudia": { city: "Jeddah", country: "Saudi Arabia", coords: [21.6796, 39.1565] },
  "Royal Jordanian": { city: "Amman", country: "Jordan", coords: [31.7226, 35.9933] },
  "Oman Air": { city: "Muscat", country: "Oman", coords: [23.5933, 58.2844] },
  // Asia & Pacific
  "Singapore Airlines": { city: "Singapore", country: "Singapore", coords: [1.3644, 103.9915] },
  "Cathay Pacific": { city: "Hong Kong", country: "Hong Kong", coords: [22.3080, 113.9185] },
  "ANA": { city: "Tokyo", country: "Japan", coords: [35.5494, 139.7798] },
  "Japan Airlines": { city: "Tokyo", country: "Japan", coords: [35.5494, 139.7798] },
  "Korean Air": { city: "Seoul", country: "South Korea", coords: [37.4602, 126.4407] },
  "Asiana Airlines": { city: "Seoul", country: "South Korea", coords: [37.4602, 126.4407] },
  "China Southern": { city: "Guangzhou", country: "China", coords: [23.3924, 113.2988] },
  "China Eastern": { city: "Shanghai", country: "China", coords: [31.1443, 121.8083] },
  "Air China": { city: "Beijing", country: "China", coords: [40.0801, 116.5846] },
  "Thai Airways": { city: "Bangkok", country: "Thailand", coords: [13.6900, 100.7501] },
  "Malaysia Airlines": { city: "Kuala Lumpur", country: "Malaysia", coords: [2.7456, 101.7099] },
  "Garuda Indonesia": { city: "Jakarta", country: "Indonesia", coords: [-6.1256, 106.6559] },
  "Philippine Airlines": { city: "Manila", country: "Philippines", coords: [14.5086, 121.0194] },
  "Vietnam Airlines": { city: "Hanoi", country: "Vietnam", coords: [21.2212, 105.8072] },
  "Air India": { city: "Mumbai", country: "India", coords: [19.0896, 72.8656] },
  "IndiGo": { city: "Delhi", country: "India", coords: [28.5562, 77.1000] },
  "Qantas": { city: "Sydney", country: "Australia", coords: [-33.9461, 151.1772] },
  "Virgin Australia": { city: "Brisbane", country: "Australia", coords: [-27.3942, 153.1218] },
  "Air New Zealand": { city: "Auckland", country: "New Zealand", coords: [-37.0082, 174.7850] },
  "Fiji Airways": { city: "Nadi", country: "Fiji", coords: [-17.7553, 177.4434] },
  // South America & Africa
  "LATAM": { city: "Sao Paulo", country: "Brazil", coords: [-23.4356, -46.4731] },
  "Avianca": { city: "Bogota", country: "Colombia", coords: [4.7016, -74.1469] },
  "Aeromexico": { city: "Mexico City", country: "Mexico", coords: [19.4361, -99.0719] },
  "Ethiopian Airlines": { city: "Addis Ababa", country: "Ethiopia", coords: [8.9779, 38.7993] },
  "South African Airways": { city: "Johannesburg", country: "South Africa", coords: [-26.1392, 28.2460] },
  "Kenya Airways": { city: "Nairobi", country: "Kenya", coords: [-1.3192, 36.9277] },
  "EgyptAir": { city: "Cairo", country: "Egypt", coords: [30.1219, 31.4055] },
  "Royal Air Maroc": { city: "Casablanca", country: "Morocco", coords: [33.3675, -7.5898] },
};

/**
 * Resolve an operator name to its hub. Tries exact match (case-insensitive),
 * then substring match for things like "British Airways Cityflyer".
 */
export function lookupHub(operator: string | undefined | null): OperatorHub | undefined {
  if (!operator) return undefined;
  const target = operator.trim();
  if (!target) return undefined;
  const exact = OPERATOR_HUBS[target];
  if (exact) return exact;
  const lower = target.toLowerCase();
  for (const [name, hub] of Object.entries(OPERATOR_HUBS)) {
    if (lower.includes(name.toLowerCase()) || name.toLowerCase().includes(lower)) {
      return hub;
    }
  }
  return undefined;
}
