/**
 * ML Engine — Historical Co-occurrence Analysis for Smarter Múltiplas
 * 
 * This module learns from historical match data to determine which market outcomes
 * tend to co-occur. Instead of naively multiplying individual probabilities,
 * it uses empirical joint hit rates from real data.
 * 
 * Key concepts:
 * - Market Outcome: A specific result like "Over 2.5 Gols" or "BTTS Sim"
 * - Co-occurrence: How often two outcomes hit together in the same game
 * - Lift: How much more likely two outcomes are to co-occur vs random chance
 *   lift > 1 = positive correlation (good for múltiplas)
 *   lift < 1 = negative correlation (avoid combining)
 */

import { supabase } from '../lib/supabase';
import { cacheService } from './cache';

export interface MarketOutcome {
    id: string;       // e.g. "over_2.5_gols"
    label: string;    // e.g. "Over 2.5 Gols"
    category: string; // e.g. "Gols"
}

export interface CorrelationResult {
    outcomeA: string;
    outcomeB: string;
    coOccurrences: number;  // times both hit together
    totalGames: number;     // total games analyzed
    jointRate: number;       // coOccurrences / totalGames (empirical joint probability)
    lift: number;           // how much better than random: jointRate / (rateA * rateB)
}

export interface MLScore {
    selections: string[];       // market IDs
    empiricalJointRate: number; // historical rate these all hit together (0-1)
    averageLift: number;        // average pairwise lift (> 1 = positive correlation)
    sampleSize: number;         // how many games this is based on
    confidence: 'high' | 'medium' | 'low'; // based on sample size
}

// Define all market outcomes we track
const MARKET_DEFINITIONS = [
    // Goals
    { id: 'over_1.5_gols', check: (g: number) => g > 1.5 },
    { id: 'over_2.5_gols', check: (g: number) => g > 2.5 },
    { id: 'over_3.5_gols', check: (g: number) => g > 3.5 },
    { id: 'under_2.5_gols', check: (g: number) => g <= 2.5 },
    { id: 'under_3.5_gols', check: (g: number) => g <= 3.5 },
    // BTTS
    { id: 'btts_sim', check: (_g: number, gH: number, gA: number) => gH > 0 && gA > 0 },
    { id: 'btts_nao', check: (_g: number, gH: number, gA: number) => gH === 0 || gA === 0 },
    // Corners
    { id: 'over_7.5_cantos', check: (_g: number, _gH: number, _gA: number, c: number) => c > 7.5 },
    { id: 'over_8.5_cantos', check: (_g: number, _gH: number, _gA: number, c: number) => c > 8.5 },
    { id: 'over_9.5_cantos', check: (_g: number, _gH: number, _gA: number, c: number) => c > 9.5 },
    { id: 'over_10.5_cantos', check: (_g: number, _gH: number, _gA: number, c: number) => c > 10.5 },
    { id: 'under_9.5_cantos', check: (_g: number, _gH: number, _gA: number, c: number) => c <= 9.5 },
    { id: 'under_10.5_cantos', check: (_g: number, _gH: number, _gA: number, c: number) => c <= 10.5 },
    { id: 'under_11.5_cantos', check: (_g: number, _gH: number, _gA: number, c: number) => c <= 11.5 },
    // Cards
    { id: 'over_3.5_cartoes', check: (_g: number, _gH: number, _gA: number, _c: number, cards: number) => cards > 3.5 },
    { id: 'over_4.5_cartoes', check: (_g: number, _gH: number, _gA: number, _c: number, cards: number) => cards > 4.5 },
    { id: 'under_4.5_cartoes', check: (_g: number, _gH: number, _gA: number, _c: number, cards: number) => cards <= 4.5 },
    { id: 'under_5.5_cartoes', check: (_g: number, _gH: number, _gA: number, _c: number, cards: number) => cards <= 5.5 },
    // 1X2 (home win)
    { id: 'home_win', check: (_g: number, gH: number, gA: number) => gH > gA },
    { id: 'draw', check: (_g: number, gH: number, gA: number) => gH === gA },
    { id: 'away_win', check: (_g: number, gH: number, gA: number) => gH < gA },
    // Double Chance
    { id: 'home_draw', check: (_g: number, gH: number, gA: number) => gH >= gA },
    { id: 'away_draw', check: (_g: number, gH: number, gA: number) => gH <= gA },
];

// Map títulos from getBetBuilders to ML market IDs
export function titleToMarketId(title: string): string | null {
    const map: Record<string, string> = {
        'Over 0.5 Gols': 'over_1.5_gols', // closest trackable line
        'Over 1.5 Gols': 'over_1.5_gols',
        'Over 2.5 Gols': 'over_2.5_gols',
        'Over 3.5 Gols': 'over_3.5_gols',
        'Under 2.5 Gols': 'under_2.5_gols',
        'Under 3.5 Gols': 'under_3.5_gols',
        'Ambas Marcam: Sim': 'btts_sim',
        'Ambas Marcam: Não': 'btts_nao',
        'Over 7.5 Cantos': 'over_7.5_cantos',
        'Over 8.5 Cantos': 'over_8.5_cantos',
        'Over 9.5 Cantos': 'over_9.5_cantos',
        'Over 10.5 Cantos': 'over_10.5_cantos',
        'Under 9.5 Cantos': 'under_9.5_cantos',
        'Under 10.5 Cantos': 'under_10.5_cantos',
        'Under 11.5 Cantos': 'under_11.5_cantos',
        'Over 3.5 Cartões': 'over_3.5_cartoes',
        'Over 4.5 Cartões': 'over_4.5_cartoes',
        'Under 4.5 Cartões': 'under_4.5_cartoes',
        'Under 5.5 Cartões': 'under_5.5_cartoes',
        'Vitória Casa': 'home_win',
        'Vitória Fora': 'away_win',
        '1X (Casa/Emp)': 'home_draw',
        'X2 (Emp/Fora)': 'away_draw',
        '12 (Não Empata)': 'home_win', // maps to the most relevant
    };
    return map[title] || null;
}

/**
 * Fetch historical data for two teams and analyze which markets hit in each game.
 * Returns a co-occurrence matrix and individual hit rates.
 */
export async function analyzeHistoricalCorrelations(
    teamAStats: any[],
    teamBStats: any[]
): Promise<{
    hitRates: Map<string, number>;
    coOccurrences: Map<string, number>;
    totalGames: number;
}> {
    const cacheKey = `ml_correlations_${teamAStats.length}_${teamBStats.length}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    // Combine both teams' historical games (removing duplicates by date)
    const allGames = new Map<string, any>();
    [...teamAStats, ...teamBStats].forEach(game => {
        const key = `${game.Data}_${game.Mandante}_${game.Visitante}`;
        allGames.set(key, game);
    });

    const games = Array.from(allGames.values());
    const totalGames = games.length;

    if (totalGames < 5) {
        return { hitRates: new Map(), coOccurrences: new Map(), totalGames };
    }

    // For each game, determine which markets hit
    const hitsPerGame: Set<string>[] = [];
    const marketHitCount = new Map<string, number>();

    games.forEach(game => {
        const goalsH = parseInt(game.Gols_Mandante) || 0;
        const goalsA = parseInt(game.Gols_Visitante) || 0;
        const totalGoals = goalsH + goalsA;
        const totalCorners = (parseInt(game.Escanteios_Mandante) || 0) + (parseInt(game.Escanteios_Visitante) || 0);
        const totalCards = (parseInt(game.Amarelos_Mandante) || 0) + (parseInt(game.Amarelos_Visitante) || 0)
            + (parseInt(game.Vermelhos_Mandante) || 0) + (parseInt(game.Vermelhos_Visitante) || 0);

        // Skip games with no corner data (incomplete records)
        if (totalCorners === 0 && totalGoals === 0) return;

        const hits = new Set<string>();
        MARKET_DEFINITIONS.forEach(market => {
            if (market.check(totalGoals, goalsH, goalsA, totalCorners, totalCards)) {
                hits.add(market.id);
                marketHitCount.set(market.id, (marketHitCount.get(market.id) || 0) + 1);
            }
        });
        hitsPerGame.push(hits);
    });

    // Build co-occurrence counts for every pair
    const coOccurrences = new Map<string, number>();
    const marketIds = MARKET_DEFINITIONS.map(m => m.id);

    for (let i = 0; i < marketIds.length; i++) {
        for (let j = i + 1; j < marketIds.length; j++) {
            const key = `${marketIds[i]}|${marketIds[j]}`;
            let count = 0;
            hitsPerGame.forEach(hits => {
                if (hits.has(marketIds[i]) && hits.has(marketIds[j])) count++;
            });
            if (count > 0) coOccurrences.set(key, count);
        }
    }

    // Hit rates
    const hitRates = new Map<string, number>();
    marketHitCount.forEach((count, id) => {
        hitRates.set(id, count / hitsPerGame.length);
    });

    const result = { hitRates, coOccurrences, totalGames: hitsPerGame.length };
    cacheService.set(cacheKey, result, 3600000);
    return result;
}

/**
 * Score a múltipla (set of market selections) using historical data.
 * Returns empirical joint hit rate and average lift.
 */
export function scoreMultipla(
    selectionTitles: string[],
    hitRates: Map<string, number>,
    coOccurrences: Map<string, number>,
    totalGames: number
): MLScore {
    const marketIds = selectionTitles
        .map(t => titleToMarketId(t))
        .filter((id): id is string => id !== null);

    if (marketIds.length < 2 || totalGames < 5) {
        return {
            selections: marketIds,
            empiricalJointRate: 0,
            averageLift: 1,
            sampleSize: totalGames,
            confidence: 'low'
        };
    }

    // Calculate naive probability (product of individual hit rates)
    const naiveProb = marketIds.reduce((acc, id) => acc * (hitRates.get(id) || 0.5), 1);

    // Calculate average pairwise lift
    let totalLift = 0;
    let pairCount = 0;

    for (let i = 0; i < marketIds.length; i++) {
        for (let j = i + 1; j < marketIds.length; j++) {
            const key = `${marketIds[i]}|${marketIds[j]}`;
            const reverseKey = `${marketIds[j]}|${marketIds[i]}`;
            const coCount = coOccurrences.get(key) || coOccurrences.get(reverseKey) || 0;

            const rateA = hitRates.get(marketIds[i]) || 0.5;
            const rateB = hitRates.get(marketIds[j]) || 0.5;
            const jointRate = coCount / totalGames;
            const expectedRate = rateA * rateB;
            const lift = expectedRate > 0 ? jointRate / expectedRate : 1;

            totalLift += lift;
            pairCount++;
        }
    }

    const avgLift = pairCount > 0 ? totalLift / pairCount : 1;

    // Empirical joint rate = naive prob adjusted by average lift
    const empiricalJointRate = Math.min(naiveProb * avgLift, 0.99);

    // Confidence based on sample size
    const confidence: 'high' | 'medium' | 'low' =
        totalGames >= 30 ? 'high' : totalGames >= 15 ? 'medium' : 'low';

    return {
        selections: marketIds,
        empiricalJointRate,
        averageLift: avgLift,
        sampleSize: totalGames,
        confidence
    };
}

/**
 * Get the ML-adjusted probability for a múltipla.
 * Returns a percentage (0-100) that accounts for historical correlations.
 */
export function getMLAdjustedProbability(
    naiveProbability: number, // The simple multiplication result
    mlScore: MLScore
): number {
    if (mlScore.sampleSize < 5) return naiveProbability;

    // Blend: weight ML data more as sample size increases
    const mlWeight = Math.min(mlScore.sampleSize / 40, 0.7); // max 70% ML influence
    const modelWeight = 1 - mlWeight;

    const mlProb = mlScore.empiricalJointRate * 100;
    const blended = (naiveProbability * modelWeight) + (mlProb * mlWeight);

    return Math.max(1, Math.min(99, blended));
}
