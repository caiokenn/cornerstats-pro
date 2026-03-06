import { supabase } from '../lib/supabase';
import { cacheService } from './cache';

export interface CornerProbabilities {
  line: number;
  over: number;
  under: number;
}

export interface TeamMetrics {
  avgGoalsScored: number;
  avgGoalsConceded: number;
  avgCornersFor: number;
  avgCornersAgainst: number;
  avgTotalCornersInGames: number;
  avgCardsFor: number;
  avgCardsAgainst: number;
  cornerGamesCount: number;
}

export interface MatchAnalysis {
  homeMetrics: TeamMetrics;
  awayMetrics: TeamMetrics;
  xG_home: number;
  xG_away: number;
  expectedTotalCorners: number;
  expectedTotalCards: number;
  // Match profile traits (derived from data)
  traits: MatchTrait[];
}

export interface MatchTrait {
  id: string;
  label: string;
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
  icon: 'goals' | 'corners' | 'cards' | 'defense' | 'attack' | 'balance';
}

export interface MarketProbabilities {
  win1X2: { home: number; draw: number; away: number };
  doubleChance: { homeDraw: number; homeAway: number; drawAway: number };
  btts: { yes: number; no: number };
  goals: { line: number; over: number; under: number }[];
  corners: CornerProbabilities[];
  cards: { line: number; over: number; under: number }[];
  handicap: { line: number; home: number; away: number }[];
  firstGoal: { home: number; none: number; away: number };
  analysis: MatchAnalysis;
}

// Helper to extract first word or main part of team name to improve matching
function getSearchTerm(teamName: string) {
  // Remove common prefixes/suffixes like "FC", "Real", "City", "United" to improve match rate
  const words = teamName.split(' ').filter(w => w.length > 2 && !['FC', 'Real', 'City', 'United', 'Athletic', 'Club'].includes(w));
  return words[0] || teamName;
}

export async function getTeamStats(teamName: string) {
  const searchTerm = getSearchTerm(teamName);
  const cacheKey = `team_stats_${searchTerm}`;

  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('Historico_jogos')
    .select('*') // Get all columns for full analysis
    .or(`Mandante.ilike.%${searchTerm}%,Visitante.ilike.%${searchTerm}%`)
    .order('Data', { ascending: false })
    .limit(50); // Get last 50 matches for more recent performance

  if (error) {
    console.error('Error fetching team stats:', error);
    return [];
  }

  cacheService.set(cacheKey, data, 3600000); // Cache for 1 hour
  return data;
}

// Knuth's algorithm for generating Poisson-distributed random numbers
function poissonRandom(lambda: number): number {
  if (lambda <= 0) return 0;
  // For larger lambdas, Knuth's method can be slow or encounter precision issues.
  // Since our lambdas (goals ~1.5, corners ~5) are small, it is perfectly fine.
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Poisson probability: P(X = k) = (lambda^k * e^-lambda) / k!
function poissonProbability(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  // Use log-space for numerical stability
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

// Calculate Over probability for a given line using Poisson
function poissonOver(lambda: number, line: number): number {
  let cumulativeUnder = 0;
  const maxK = Math.floor(line);
  for (let k = 0; k <= maxK; k++) {
    cumulativeUnder += poissonProbability(lambda, k);
  }
  return Math.max(0, Math.min(100, (1 - cumulativeUnder) * 100));
}

export function calculateFullProbabilities(teamAStats: any[], teamBStats: any[], teamA: string, teamB: string): MarketProbabilities {
  const NUM_SIMULATIONS = 10000;

  // 1. Calculate advanced metrics (Attack vs Defense Ratings)
  const calculateTeamMetrics = (stats: any[], teamName: string) => {
    let goalsScored = 0, goalsConceded = 0;
    let cornersFor = 0, cornersAgainst = 0;
    let totalCornersInGames = 0; // NEW: track total corners in all games for this team
    let cardsFor = 0, cardsAgainst = 0;
    let matchCount = 0;
    let cornerGamesCount = 0; // games where corner data exists

    // Use the search term (stripped name) for more robust matching
    const searchTerm = getSearchTerm(teamName).toLowerCase();

    stats.forEach(game => {
      const isHome = game.Mandante?.toLowerCase().includes(searchTerm);
      if (isHome) {
        goalsScored += parseInt(game.Gols_Mandante) || 0;
        goalsConceded += parseInt(game.Gols_Visitante) || 0;
        cornersFor += parseInt(game.Escanteios_Mandante) || 0;
        cornersAgainst += parseInt(game.Escanteios_Visitante) || 0;
        cardsFor += (parseInt(game.Amarelos_Mandante) || 0) + (parseInt(game.Vermelhos_Mandante) || 0);
        cardsAgainst += (parseInt(game.Amarelos_Visitante) || 0) + (parseInt(game.Vermelhos_Visitante) || 0);
      } else {
        goalsScored += parseInt(game.Gols_Visitante) || 0;
        goalsConceded += parseInt(game.Gols_Mandante) || 0;
        cornersFor += parseInt(game.Escanteios_Visitante) || 0;
        cornersAgainst += parseInt(game.Escanteios_Mandante) || 0;
        cardsFor += (parseInt(game.Amarelos_Visitante) || 0) + (parseInt(game.Vermelhos_Visitante) || 0);
        cardsAgainst += (parseInt(game.Amarelos_Mandante) || 0) + (parseInt(game.Vermelhos_Mandante) || 0);
      }

      // Track total corners in each game (home + away corners)
      const gameTotalCorners = (parseInt(game.Escanteios_Mandante) || 0) + (parseInt(game.Escanteios_Visitante) || 0);
      if (gameTotalCorners > 0) {
        totalCornersInGames += gameTotalCorners;
        cornerGamesCount++;
      }

      matchCount++;
    });

    const m = matchCount || 1;
    const cg = cornerGamesCount || 1;
    return {
      avgGoalsScored: goalsScored / m,
      avgGoalsConceded: goalsConceded / m,
      avgCornersFor: cornersFor / m,
      avgCornersAgainst: cornersAgainst / m,
      avgTotalCornersInGames: totalCornersInGames / cg, // NEW: avg total in team's matches
      avgCardsFor: cardsFor / m,
      avgCardsAgainst: cardsAgainst / m,
      cornerGamesCount: cornerGamesCount,
    };
  };

  const metricsA = calculateTeamMetrics(teamAStats, teamA);
  const metricsB = calculateTeamMetrics(teamBStats, teamB);

  // League Baselines (Approximations)
  const BASE_GOALS = 1.35;
  const BASE_CORNERS = 4.8;
  const BASE_CARDS = 2.2;

  // Expected values (xG, xC, xCards) based on Bivariate Attack/Defense rating
  let xG_A = (metricsA.avgGoalsScored * metricsB.avgGoalsConceded) / BASE_GOALS;
  let xG_B = (metricsB.avgGoalsScored * metricsA.avgGoalsConceded) / BASE_GOALS;

  // Home Advantage Modifiers
  xG_A = (isNaN(xG_A) || xG_A === 0 ? 1.4 : xG_A) * 1.12;
  xG_B = (isNaN(xG_B) || xG_B === 0 ? 1.2 : xG_B) * 0.90;

  // -------------------------------------------------------------
  // CORNER ENGINE: Data-Driven Model (Based on Real Database Analysis)
  // Uses TOTAL CORNERS PER GAME for each team directly from DB
  // This bypasses attack/defense splitting which fails with unclean data
  // Real DB average: ~9.2 total corners per game
  // -------------------------------------------------------------

  const LEAGUE_AVG_TOTAL_CORNERS = 9.22; // From real Supabase data analysis

  // Use each team's actual average TOTAL corners in their games
  // If a team's games average 11 total corners, they play in open affairs
  // If a team's games average 7 total corners, their games are tight
  const avgTotalInA = metricsA.cornerGamesCount > 3 ? metricsA.avgTotalCornersInGames : LEAGUE_AVG_TOTAL_CORNERS;
  const avgTotalInB = metricsB.cornerGamesCount > 3 ? metricsB.avgTotalCornersInGames : LEAGUE_AVG_TOTAL_CORNERS;

  // Expected total corners for THIS match = average of both teams' game profiles
  // E.g., Team A games avg 10.5, Team B games avg 8.0 -> Expected = 9.25
  const expectedTotalCorners = (avgTotalInA + avgTotalInB) / 2;

  // Use Poisson distribution directly for corner line probabilities
  const calculateOverProbCorners = (line: number) => poissonOver(expectedTotalCorners, line);

  let xCards_A = (metricsA.avgCardsFor * metricsB.avgCardsAgainst) / BASE_CARDS;
  let xCards_B = (metricsB.avgCardsFor * metricsA.avgCardsAgainst) / BASE_CARDS;
  const expectedTotalCards = (isNaN(xCards_A) ? 2.5 : xCards_A) + (isNaN(xCards_B) ? 2.5 : xCards_B);

  // 2. Advanced Minute-by-Minute Monte Carlo Simulation Engine
  let simHomeWins = 0, simDraws = 0, simAwayWins = 0;
  let simBTTS = 0;
  let simFirstGoalHome = 0, simFirstGoalAway = 0, simFirstGoalNone = 0;

  const goalLines = [0.5, 1.5, 2.5, 3.5, 4.5];
  const simOverGoals = goalLines.map(() => 0);

  const cornerLines = [7.5, 8.5, 9.5, 10.5, 11.5];
  const simOverCorners = cornerLines.map(() => 0);

  const cardLines = [3.5, 4.5, 5.5];
  const simOverCards = cardLines.map(() => 0);

  const handicapLines = [-1.5, -0.5, 0.5, 1.5];
  const simHandicapHome = handicapLines.map(() => 0);

  for (let iter = 0; iter < NUM_SIMULATIONS; iter++) {
    let simGoalsA = 0;
    let simGoalsB = 0;
    let simCardsTotal = 0;
    let firstScorer = 0; // 0 = none, 1 = Home, 2 = Away

    // Simulate 90 minutes of football dynamically (Goals & Cards only)
    for (let minute = 1; minute <= 90; minute++) {
      let minProbGoalA = xG_A / 90;
      let minProbGoalB = xG_B / 90;
      let minProbCard = expectedTotalCards / 90;

      // -----------------------------------------------------
      // Game State Dynamics (Momentum & Desperation)
      // -----------------------------------------------------
      const goalDiff = simGoalsA - simGoalsB;

      if (goalDiff < 0) { // Home losing
        minProbGoalA *= 1.15; // Attack more
        minProbGoalB *= 1.20; // Defense open to counters
      } else if (goalDiff > 0) { // Away losing
        minProbGoalB *= 1.15;
        minProbGoalA *= 1.20;
      }

      // Late game intensity & "All-Out Attack" (Hoofball)
      if (minute > 75) {
        if (goalDiff === 0 || Math.abs(goalDiff) === 1) {
          minProbCard *= 1.30; // Desperation fouls
        }

        // If a much stronger team is losing/drawing late, they spam crosses
        // (This only affects goals and counters now, corners are handled mathematically by NBD)
        if (goalDiff <= 0 && xG_A > xG_B * 1.5) {
          minProbGoalB *= 1.30; // Extremely vulnerable to counter
        } else if (goalDiff >= 0 && xG_B > xG_A * 1.5) {
          minProbGoalA *= 1.30;
        }
      }

      // -----------------------------------------------------
      // Goals & Cards RNG
      // -----------------------------------------------------
      if (Math.random() < minProbGoalA) {
        simGoalsA++;
        if (firstScorer === 0) firstScorer = 1;
      }
      if (Math.random() < minProbGoalB) {
        simGoalsB++;
        if (firstScorer === 0) firstScorer = 2;
      }
      if (Math.random() < minProbCard) simCardsTotal++;
    }

    if (firstScorer === 1) simFirstGoalHome++;
    else if (firstScorer === 2) simFirstGoalAway++;
    else simFirstGoalNone++;

    // 1X2 & Double Chance
    if (simGoalsA > simGoalsB) simHomeWins++;
    else if (simGoalsA === simGoalsB) simDraws++;
    else simAwayWins++;

    // BTTS
    if (simGoalsA > 0 && simGoalsB > 0) simBTTS++;

    // Over/Under Goals
    const totalGoals = simGoalsA + simGoalsB;
    goalLines.forEach((line, idx) => {
      if (totalGoals > line) simOverGoals[idx]++;
    });


    // Over/Under Cards
    cardLines.forEach((line, idx) => {
      if (simCardsTotal > line) simOverCards[idx]++;
    });

    // Handicap
    const goalDiff = simGoalsA - simGoalsB;
    handicapLines.forEach((line, idx) => {
      if (goalDiff + line > 0) simHandicapHome[idx]++;
      // Note: in Asian lines like -1.0, a tie yields a void/push. 
      // Our lines are .5 so there are no pushes.
    });
  }

  // 3. Compile Results
  const pct = (val: number) => (val / NUM_SIMULATIONS) * 100;

  const pHome = pct(simHomeWins);
  const pDraw = pct(simDraws);
  const pAway = pct(simAwayWins);

  const goals = goalLines.map((line, idx) => {
    const over = pct(simOverGoals[idx]);
    return { line, over, under: 100 - over };
  });

  const corners = cornerLines.map((line) => {
    // We bypass simulation for corners and use the Empirical Parameterized Curve
    const over = calculateOverProbCorners(line);
    return { line, over, under: 100 - over };
  });

  const cards = cardLines.map((line, idx) => {
    const over = pct(simOverCards[idx]);
    return { line, over, under: 100 - over };
  });

  const handicap = handicapLines.map((line, idx) => {
    const homeProb = pct(simHandicapHome[idx]);
    return { line, home: homeProb, away: 100 - homeProb };
  });

  // 4. Match Profiling — Analyze traits from data
  const traits: MatchTrait[] = [];
  const totalXG = xG_A + xG_B;

  // Offensive profile
  if (totalXG >= 3.0) traits.push({ id: 'high_scoring', label: 'Jogo Aberto', description: `xG total ${totalXG.toFixed(1)} — ambos atacam`, strength: totalXG >= 3.5 ? 'strong' : 'moderate', icon: 'goals' });
  if (totalXG < 2.0) traits.push({ id: 'low_scoring', label: 'Jogo Truncado', description: `xG total ${totalXG.toFixed(1)} — perfil defensivo`, strength: totalXG < 1.5 ? 'strong' : 'moderate', icon: 'defense' });

  // Corner profile
  if (expectedTotalCorners >= 10.5) traits.push({ id: 'corner_heavy', label: 'Chuva de Cantos', description: `Média ${expectedTotalCorners.toFixed(1)} cantos por jogo`, strength: expectedTotalCorners >= 11.5 ? 'strong' : 'moderate', icon: 'corners' });
  if (expectedTotalCorners < 8.5) traits.push({ id: 'corner_light', label: 'Poucos Cantos', description: `Média ${expectedTotalCorners.toFixed(1)} cantos por jogo`, strength: expectedTotalCorners < 7.5 ? 'strong' : 'moderate', icon: 'corners' });

  // Cards profile
  if (expectedTotalCards >= 5.0) traits.push({ id: 'card_heavy', label: 'Jogo Quente', description: `${expectedTotalCards.toFixed(1)} cartões esperados`, strength: expectedTotalCards >= 6.0 ? 'strong' : 'moderate', icon: 'cards' });

  // Home dominance
  if (xG_A > xG_B * 1.8) traits.push({ id: 'home_dominant', label: 'Domínio Mandante', description: `Casa xG ${xG_A.toFixed(2)} vs Fora ${xG_B.toFixed(2)}`, strength: xG_A > xG_B * 2.5 ? 'strong' : 'moderate', icon: 'attack' });
  if (xG_B > xG_A * 1.4) traits.push({ id: 'away_strong', label: 'Visitante Forte', description: `Fora xG ${xG_B.toFixed(2)} desafia mando`, strength: xG_B > xG_A * 1.8 ? 'strong' : 'moderate', icon: 'attack' });

  // BTTS profile
  if (metricsA.avgGoalsScored >= 1.3 && metricsB.avgGoalsScored >= 1.3) traits.push({ id: 'btts_likely', label: 'Ambos Marcam', description: `Ataques ativos: ${metricsA.avgGoalsScored.toFixed(1)} e ${metricsB.avgGoalsScored.toFixed(1)} gols/jogo`, strength: 'moderate', icon: 'goals' });
  if (metricsA.avgGoalsConceded < 0.8 || metricsB.avgGoalsConceded < 0.8) traits.push({ id: 'solid_defense', label: 'Defesa Sólida', description: `Um time sofre < 0.8 gols/jogo`, strength: 'moderate', icon: 'defense' });

  // Close match
  if (Math.abs(xG_A - xG_B) < 0.3) traits.push({ id: 'balanced_match', label: 'Equilíbrio', description: `xG próximos (${xG_A.toFixed(2)} vs ${xG_B.toFixed(2)})`, strength: 'moderate', icon: 'balance' });

  const analysis: MatchAnalysis = {
    homeMetrics: metricsA,
    awayMetrics: metricsB,
    xG_home: xG_A,
    xG_away: xG_B,
    expectedTotalCorners,
    expectedTotalCards,
    traits
  };

  return {
    win1X2: { home: pHome, draw: pDraw, away: pAway },
    doubleChance: {
      homeDraw: pHome + pDraw,
      homeAway: pHome + pAway,
      drawAway: pDraw + pAway
    },
    btts: { yes: pct(simBTTS), no: 100 - pct(simBTTS) },
    goals,
    corners,
    cards,
    handicap,
    firstGoal: {
      home: pct(simFirstGoalHome),
      away: pct(simFirstGoalAway),
      none: pct(simFirstGoalNone)
    },
    analysis
  };
}

// Keep the old function for backward compatibility if needed, but redirect to new logic
export function calculateProbabilities(teamAStats: any[], teamBStats: any[], teamA: string, teamB: string): CornerProbabilities[] {
  const full = calculateFullProbabilities(teamAStats, teamBStats, teamA, teamB);
  return full.corners;
}

