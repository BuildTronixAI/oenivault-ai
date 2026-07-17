/**
 * Wine valuation estimates.
 * Uses optional external VALUATION_API_URL when set; otherwise a transparent
 * heuristic model based on region, varietal, vintage age, and name prestige.
 */

export interface ValuationInput {
  name: string;
  vintage?: number | null;
  region?: string | null;
  varietal?: string | null;
}

export interface ValuationResult {
  estimatedValue: number;
  currency: 'USD';
  confidence: 'low' | 'medium' | 'high';
  source: 'heuristic' | 'external';
  rationale: string[];
}

const REGION_MULTIPLIER: Record<string, number> = {
  burgundy: 2.4,
  bordeaux: 2.0,
  champagne: 1.9,
  'napa valley': 1.8,
  piedmont: 1.7,
  tuscany: 1.6,
  rhone: 1.5,
  rioja: 1.3,
  'willamette valley': 1.4,
  sonoma: 1.45,
};

const VARIETAL_BASE: Record<string, number> = {
  'pinot noir': 95,
  'cabernet sauvignon': 85,
  'bordeaux blend': 110,
  chardonnay: 55,
  nebbiolo: 100,
  sangiovese: 70,
  merlot: 60,
  syrah: 65,
  'syrah/shiraz': 65,
  riesling: 50,
};

const PRESTIGE_KEYWORDS = [
  { re: /roman[eé]e|dom peri|krug|opus one|screaming eagle|harlan|p[eé]trus|lafite|latour|margaux|mouton/i, bump: 1800, confidence: 'high' as const },
  { re: /grand cru|premier cru|1er|first growth|reserva especial/i, bump: 220, confidence: 'medium' as const },
  { re: /reserve|reserva|gran reserva|estate|single vineyard/i, bump: 40, confidence: 'medium' as const },
];

function ageFactor(vintage?: number | null): { factor: number; note?: string } {
  if (!vintage) return { factor: 1 };
  const age = new Date().getFullYear() - vintage;
  if (age < 0) return { factor: 0.9, note: 'Future vintage discount' };
  if (age <= 3) return { factor: 1.0, note: 'Young wine' };
  if (age <= 10) return { factor: 1.15, note: 'Maturing window' };
  if (age <= 20) return { factor: 1.35, note: 'Peak cellar age' };
  if (age <= 40) return { factor: 1.2, note: 'Mature — condition dependent' };
  return { factor: 0.95, note: 'Very old — collectible risk' };
}

function lookup(map: Record<string, number>, key?: string | null): { value?: number; matched?: string } {
  if (!key) return {};
  const normalized = key.trim().toLowerCase();
  if (map[normalized] != null) return { value: map[normalized], matched: key };
  const hit = Object.entries(map).find(([k]) => normalized.includes(k) || k.includes(normalized));
  if (hit) return { value: hit[1], matched: hit[0] };
  return {};
}

export function estimateHeuristic(input: ValuationInput): ValuationResult {
  const rationale: string[] = [];
  let confidence: ValuationResult['confidence'] = 'low';

  const varietal = lookup(VARIETAL_BASE, input.varietal);
  let base = varietal.value ?? 65;
  if (varietal.matched) {
    rationale.push(`Varietal baseline for ${varietal.matched}: $${base}`);
    confidence = 'medium';
  } else {
    rationale.push(`Default varietal baseline: $${base}`);
  }

  const region = lookup(REGION_MULTIPLIER, input.region);
  const regionMult = region.value ?? 1.1;
  if (region.matched) {
    rationale.push(`Region multiplier (${region.matched}): ×${regionMult}`);
    if (confidence === 'low') confidence = 'medium';
  } else if (input.region) {
    rationale.push(`Unknown region "${input.region}" — light ×${regionMult}`);
  }

  const age = ageFactor(input.vintage);
  if (age.note) rationale.push(`${age.note} (×${age.factor})`);

  let prestige = 0;
  for (const p of PRESTIGE_KEYWORDS) {
    if (p.re.test(input.name)) {
      prestige += p.bump;
      rationale.push(`Prestige signal in name: +$${p.bump}`);
      confidence = p.confidence === 'high' ? 'high' : confidence === 'low' ? 'medium' : confidence;
      break;
    }
  }

  const estimatedValue = Math.round((base * regionMult * age.factor + prestige) * 100) / 100;
  rationale.push(`Estimated bottle value: $${estimatedValue.toFixed(2)}`);

  return {
    estimatedValue,
    currency: 'USD',
    confidence,
    source: 'heuristic',
    rationale,
  };
}

export async function estimateValue(input: ValuationInput): Promise<ValuationResult> {
  const apiUrl = process.env.VALUATION_API_URL;
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.VALUATION_API_KEY
            ? { Authorization: `Bearer ${process.env.VALUATION_API_KEY}` }
            : {}),
        },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          estimatedValue?: number;
          value?: number;
          confidence?: ValuationResult['confidence'];
          rationale?: string[];
        };
        const estimatedValue = Number(data.estimatedValue ?? data.value);
        if (Number.isFinite(estimatedValue)) {
          return {
            estimatedValue,
            currency: 'USD',
            confidence: data.confidence ?? 'medium',
            source: 'external',
            rationale: data.rationale ?? ['External valuation API'],
          };
        }
      }
    } catch {
      // fall through to heuristic
    }
  }
  return estimateHeuristic(input);
}
