import React, { useState } from 'react';
import { ChevronDown, AnalyticsChart, SpinnerIcon, WarningCircle, ShareIcon, CornerFlag, TrendUp, LightningBolt, SoccerBall, StarIcon, StackLayers, YellowCard, Crosshair, ShieldIcon, HomeTeam, BalanceScale, BrainInsight } from './Icons';
import { ESPNMatch } from '../services/espn';
import { getTeamStats, calculateFullProbabilities, MarketProbabilities } from '../services/analysis';
import { analyzeHistoricalCorrelations, scoreMultipla, getMLAdjustedProbability, MLScore } from '../services/mlEngine';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface MatchCardProps {
  key?: string | number;
  match: ESPNMatch;
}

export interface BettingTip {
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  type: 'corners' | 'goals' | 'cards' | 'match_winner';
  probability?: number;
  selectionLine?: number;
  selectionSide?: 'over' | 'under' | 'home' | 'away' | 'draw' | 'yes' | 'no';
}

export interface BetBuilder {
  label: string;
  icon: 'goals' | 'defense' | 'corners' | 'home' | 'cards' | 'balance' | 'brain';
  riskLevel: 'safe' | 'balanced' | 'bold';
  reasoning: string;
  selections: { title: string; probability: number; category: string }[];
  totalProbability: number;
  mlScore?: MLScore;
}

// Helper: pick best option for a category from probs
type SelOption = { title: string; probability: number; category: string };

function pickBest(options: SelOption[], category: string): SelOption | null {
  return options.filter(o => o.category === category).sort((a, b) => b.probability - a.probability)[0] || null;
}

// --- INTELLIGENT: Build múltiplas based on match analysis traits ---
function getBetBuilders(probs: MarketProbabilities | null, mlData: any): BetBuilder[] {
  if (!probs || !probs.analysis) return [];

  const { analysis } = probs;
  const traitIds = new Set(analysis.traits.map(t => t.id));
  const builders: BetBuilder[] = [];

  // Build pool of all available selections
  const pool: SelOption[] = [];

  // 1X2
  if (probs.win1X2.home > 50) pool.push({ title: 'Vitória Casa', probability: probs.win1X2.home, category: 'Resultado' });
  if (probs.win1X2.away > 50) pool.push({ title: 'Vitória Fora', probability: probs.win1X2.away, category: 'Resultado' });
  if (probs.doubleChance.homeDraw > 55) pool.push({ title: '1X (Casa/Emp)', probability: probs.doubleChance.homeDraw, category: 'Dupla Chance' });
  if (probs.doubleChance.drawAway > 55) pool.push({ title: 'X2 (Emp/Fora)', probability: probs.doubleChance.drawAway, category: 'Dupla Chance' });
  if (probs.doubleChance.homeAway > 55) pool.push({ title: '12 (Não Empata)', probability: probs.doubleChance.homeAway, category: 'Dupla Chance' });

  // Goals
  probs.goals.forEach(g => {
    if (g.line >= 0.5 && g.line <= 4.5) {
      if (g.over > 45) pool.push({ title: `Over ${g.line} Gols`, probability: g.over, category: 'Gols' });
      if (g.under > 45) pool.push({ title: `Under ${g.line} Gols`, probability: g.under, category: 'Gols' });
    }
  });

  // Corners
  probs.corners.forEach(c => {
    if (c.over > 40) pool.push({ title: `Over ${c.line} Cantos`, probability: c.over, category: 'Cantos' });
    if (c.under > 45) pool.push({ title: `Under ${c.line} Cantos`, probability: c.under, category: 'Cantos' });
  });

  // BTTS
  if (probs.btts.yes > 30) pool.push({ title: 'Ambas Marcam: Sim', probability: probs.btts.yes, category: 'BTTS' });
  if (probs.btts.no > 30) pool.push({ title: 'Ambas Marcam: Não', probability: probs.btts.no, category: 'BTTS' });

  // Cards
  probs.cards.forEach(c => {
    if (c.over > 45) pool.push({ title: `Over ${c.line} Cartões`, probability: c.over, category: 'Cartões' });
    if (c.under > 45) pool.push({ title: `Under ${c.line} Cartões`, probability: c.under, category: 'Cartões' });
  });

  // First Goal
  if (probs.firstGoal.home > 45) pool.push({ title: '1° Gol: Casa', probability: probs.firstGoal.home, category: '1° Gol' });
  if (probs.firstGoal.away > 40) pool.push({ title: '1° Gol: Fora', probability: probs.firstGoal.away, category: '1° Gol' });

  const calcTotal = (sels: SelOption[]) => sels.reduce((acc, s) => acc * (s.probability / 100), 1) * 100;

  // === Market Slot System: prevents duplicate market types in one múltipla ===
  const getSlot = (sel: SelOption): string => {
    if (sel.category === 'Gols' && sel.title.startsWith('Over')) return 'goals_over';
    if (sel.category === 'Gols' && sel.title.startsWith('Under')) return 'goals_under';
    if (sel.category === 'Cantos' && sel.title.startsWith('Over')) return 'corners_over';
    if (sel.category === 'Cantos' && sel.title.startsWith('Under')) return 'corners_under';
    if (sel.category === 'Cartões' && sel.title.startsWith('Over')) return 'cards_over';
    if (sel.category === 'Cartões' && sel.title.startsWith('Under')) return 'cards_under';
    if (sel.category === 'BTTS') return 'btts';
    if (sel.category === 'Resultado') return 'result';
    if (sel.category === 'Dupla Chance') return 'double_chance';
    if (sel.category === '1° Gol') return 'first_goal';
    return sel.title;
  };

  // Safely add a selection only if its market slot is not taken
  const addIfFree = (sels: SelOption[], usedSlots: Set<string>, sel: SelOption | undefined | null): boolean => {
    if (!sel) return false;
    const slot = getSlot(sel);
    if (usedSlots.has(slot)) return false;
    sels.push(sel);
    usedSlots.add(slot);
    return true;
  };

  // Pre-compute best options per market slot
  const bestGoalOver = pool.filter(o => o.title.startsWith('Over') && o.category === 'Gols').sort((a, b) => b.probability - a.probability)[0];
  const bestGoalUnder = pool.filter(o => o.title.startsWith('Under') && o.category === 'Gols' && !o.title.includes('0.5')).sort((a, b) => b.probability - a.probability)[0];
  const bestCornerOver = pool.filter(o => o.title.startsWith('Over') && o.category === 'Cantos').sort((a, b) => b.probability - a.probability)[0];
  const bestCornerUnder = pool.filter(o => o.title.startsWith('Under') && o.category === 'Cantos').sort((a, b) => b.probability - a.probability)[0];
  const bestCardOver = pool.filter(o => o.title.startsWith('Over') && o.category === 'Cartões').sort((a, b) => b.probability - a.probability)[0];
  const bestCardUnder = pool.filter(o => o.title.startsWith('Under') && o.category === 'Cartões').sort((a, b) => b.probability - a.probability)[0];
  const bestResult = pool.filter(o => o.category === 'Resultado').sort((a, b) => b.probability - a.probability)[0];
  const bestDC = pool.filter(o => o.category === 'Dupla Chance').sort((a, b) => b.probability - a.probability)[0];
  const bttsYes = pool.find(o => o.title === 'Ambas Marcam: Sim');
  const bttsNo = pool.find(o => o.title === 'Ambas Marcam: Não');
  const firstGoalHome = pool.find(o => o.title === '1° Gol: Casa');

  // === TRAIT-BASED MÚLTIPLA GENERATION (with slot dedup) ===

  // GOLEADA — Pick BEST goal over line only (not both 1.5 and 2.5)
  if (traitIds.has('high_scoring')) {
    const sels: SelOption[] = []; const slots = new Set<string>();
    const over25 = pool.find(o => o.title === 'Over 2.5 Gols');
    const over15 = pool.find(o => o.title === 'Over 1.5 Gols');
    addIfFree(sels, slots, (over25 && over25.probability > 50) ? over25 : over15);
    addIfFree(sels, slots, bttsYes && bttsYes.probability > 35 ? bttsYes : null);
    addIfFree(sels, slots, bestCornerOver);
    addIfFree(sels, slots, bestCardOver && bestCardOver.probability > 55 ? bestCardOver : null);
    if (sels.length >= 2) builders.push({ label: 'Goleada', icon: 'goals', riskLevel: 'balanced', reasoning: `xG total ${(analysis.xG_home + analysis.xG_away).toFixed(1)} — perfil ofensivo dos dois lados`, selections: sels, totalProbability: calcTotal(sels) });
  }

  // CLÁSSICO DEFENSIVO — under gols + BTTS Não + DC + under cards
  if (traitIds.has('low_scoring') || traitIds.has('solid_defense')) {
    const sels: SelOption[] = []; const slots = new Set<string>();
    const under25 = pool.find(o => o.title === 'Under 2.5 Gols');
    const under35 = pool.find(o => o.title === 'Under 3.5 Gols');
    addIfFree(sels, slots, (under25 && under25.probability > 55) ? under25 : under35);
    addIfFree(sels, slots, bttsNo && bttsNo.probability > 50 ? bttsNo : null);
    addIfFree(sels, slots, bestDC && bestDC.probability > 65 ? bestDC : null);
    addIfFree(sels, slots, bestCardUnder && bestCardUnder.probability > 55 ? bestCardUnder : null);
    if (sels.length >= 2) builders.push({ label: 'Clássico Defensivo', icon: 'defense', riskLevel: 'safe', reasoning: `xG total ${(analysis.xG_home + analysis.xG_away).toFixed(1)} — defesas prevalecem`, selections: sels, totalProbability: calcTotal(sels) });
  }

  // CHUVA DE CANTOS — best corner over + goal over + result/DC
  if (traitIds.has('corner_heavy')) {
    const sels: SelOption[] = []; const slots = new Set<string>();
    addIfFree(sels, slots, bestCornerOver);
    addIfFree(sels, slots, bestGoalOver && bestGoalOver.probability > 55 ? bestGoalOver : null);
    addIfFree(sels, slots, bestResult && bestResult.probability > 55 ? bestResult : bestDC);
    addIfFree(sels, slots, bttsYes && bttsYes.probability > 45 ? bttsYes : null);
    if (sels.length >= 2) builders.push({ label: 'Chuva de Cantos', icon: 'corners', riskLevel: 'balanced', reasoning: `Média ${analysis.expectedTotalCorners.toFixed(1)} cantos/jogo nos confrontos desses times`, selections: sels, totalProbability: calcTotal(sels) });
  }

  // DOMÍNIO CASA — vitória + 1° gol casa + goal over + corner
  if (traitIds.has('home_dominant')) {
    const sels: SelOption[] = []; const slots = new Set<string>();
    addIfFree(sels, slots, pool.find(o => o.title === 'Vitória Casa'));
    addIfFree(sels, slots, firstGoalHome && firstGoalHome.probability > 45 ? firstGoalHome : null);
    addIfFree(sels, slots, bestGoalOver && bestGoalOver.probability > 55 ? bestGoalOver : null);
    addIfFree(sels, slots, bestCornerOver);
    if (sels.length >= 2) builders.push({ label: 'Domínio Casa', icon: 'home', riskLevel: 'balanced', reasoning: `Mandante xG ${analysis.xG_home.toFixed(2)} vs Fora ${analysis.xG_away.toFixed(2)}`, selections: sels, totalProbability: calcTotal(sels) });
  }

  // JOGO QUENTE — over cartões + corner + goal + DC
  if (traitIds.has('card_heavy')) {
    const sels: SelOption[] = []; const slots = new Set<string>();
    addIfFree(sels, slots, bestCardOver);
    addIfFree(sels, slots, bestCornerOver);
    addIfFree(sels, slots, bestGoalOver && bestGoalOver.probability > 50 ? bestGoalOver : null);
    addIfFree(sels, slots, bestDC && bestDC.probability > 65 ? bestDC : null);
    if (sels.length >= 2) builders.push({ label: 'Jogo Quente', icon: 'cards', riskLevel: 'bold', reasoning: `${analysis.expectedTotalCards.toFixed(1)} cartões esperados — jogo intenso`, selections: sels, totalProbability: calcTotal(sels) });
  }

  // EQUILÍBRIO — DC + goal over + corner
  if (traitIds.has('balanced_match')) {
    const sels: SelOption[] = []; const slots = new Set<string>();
    const notDraw = pool.find(o => o.title === '12 (Não Empata)');
    addIfFree(sels, slots, notDraw && notDraw.probability > 60 ? notDraw : bestDC);
    addIfFree(sels, slots, bestGoalOver && bestGoalOver.probability > 55 ? bestGoalOver : null);
    addIfFree(sels, slots, bestCornerOver);
    if (sels.length >= 2) builders.push({ label: 'Equilíbrio', icon: 'balance', riskLevel: 'safe', reasoning: `xG próximos (${analysis.xG_home.toFixed(2)} vs ${analysis.xG_away.toFixed(2)}) — jogo disputado`, selections: sels, totalProbability: calcTotal(sels) });
  }

  // FALLBACK: Best pick from each unique slot
  if (builders.length === 0) {
    const sels: SelOption[] = []; const slots = new Set<string>();
    const slotBest = new Map<string, SelOption>();
    pool.forEach(o => {
      const slot = getSlot(o);
      const existing = slotBest.get(slot);
      if (!existing || o.probability > existing.probability) slotBest.set(slot, o);
    });
    Array.from(slotBest.values()).sort((a, b) => b.probability - a.probability).slice(0, 3).forEach(o => { if (o.probability > 55) addIfFree(sels, slots, o); });
    if (sels.length >= 2) builders.push({ label: 'Múltipla IA', icon: 'brain', riskLevel: 'balanced', reasoning: `Seleção automática baseada nas maiores probabilidades cruzadas`, selections: sels, totalProbability: calcTotal(sels) });
  }

  // Validate and apply ML scores
  return builders.filter(b => b.selections.length >= 2).map(b => {
    if (mlData && mlData.totalGames >= 5) {
      const titles = b.selections.map(s => s.title);
      const score = scoreMultipla(titles, mlData.hitRates, mlData.coOccurrences, mlData.totalGames);
      // If historical data is strong, blend the mathematical prob with the empirical ML prob
      if (score.confidence !== 'low') {
        b.totalProbability = getMLAdjustedProbability(calcTotal(b.selections), score);
        b.mlScore = score;
      }
    }
    return b;
  });
}


// --- ENHANCED: Return multiple tips instead of one ---
function getBettingTips(match: ESPNMatch, probs: MarketProbabilities | null): BettingTip[] {
  const isLive = match.status.type.state === 'in';
  const isFinished = match.status.type.state === 'post';
  if (isFinished) return [];

  const tips: BettingTip[] = [];

  // Live Tips
  if (isLive && match.homeTeam.stats && match.awayTeam.stats) {
    const homeStats = match.homeTeam.stats;
    const awayStats = match.awayTeam.stats;
    const clock = match.status.type.shortDetail;
    let minutes = 0;
    if (clock.includes("'")) { minutes = parseInt(clock.replace("'", "").split('+')[0]) || 0; }
    else if (clock === 'Halftime') { minutes = 45; }
    const homeScore = parseInt(match.homeTeam.score || '0');
    const awayScore = parseInt(match.awayTeam.score || '0');
    const homeCorners = parseInt(homeStats.corners || '0');
    const awayCorners = parseInt(awayStats.corners || '0');
    const totalCorners = homeCorners + awayCorners;
    const homeShots = parseInt(homeStats.shots || '0');
    const awayShots = parseInt(awayStats.shots || '0');
    const totalShots = homeShots + awayShots;
    const homePossession = parseFloat(homeStats.possession || '50');

    if (totalShots > minutes * 0.35 && (homeScore + awayScore) < 2 && minutes < 75)
      tips.push({ title: 'Over Gols (Live)', description: `${totalShots} chutes e poucos gols. Pressão latente.`, confidence: 'high', type: 'goals', selectionSide: 'over' });
    if (totalCorners > minutes * 0.18)
      tips.push({ title: 'Over Cantos (Live)', description: `${totalCorners} cantos em ${minutes}'. Ritmo intenso.`, confidence: 'high', type: 'corners', selectionSide: 'over' });
    if (homePossession > 62 && homeShots > awayShots * 1.8 && homeScore <= awayScore)
      tips.push({ title: `Pressão ${match.homeTeam.name}`, description: `${homePossession}% posse, buscando a virada.`, confidence: 'medium', type: 'match_winner', selectionSide: 'home' });
    if (minutes >= 70 && Math.abs(homeScore - awayScore) <= 1 && totalShots > 15)
      tips.push({ title: 'Cantos Finais', description: `Reta final disputada = mais escanteios.`, confidence: 'high', type: 'corners', selectionSide: 'over' });
    if (minutes < 60 && totalCorners < 4 && totalShots < 8)
      tips.push({ title: 'Under Cantos (Live)', description: `Jogo travado, ritmo baixo de cantos.`, confidence: 'medium', type: 'corners', selectionSide: 'under' });
  }

  // Pre-match tips from probabilities
  if (probs) {
    // 1X2
    if (probs.win1X2.home > 58) tips.push({ title: `Vitória: ${match.homeTeam.name}`, description: `Mandante com favoritismo.`, confidence: probs.win1X2.home > 72 ? 'high' : 'medium', type: 'match_winner', probability: probs.win1X2.home, selectionSide: 'home' });
    if (probs.win1X2.away > 58) tips.push({ title: `Vitória: ${match.awayTeam.name}`, description: `Visitante superior.`, confidence: probs.win1X2.away > 72 ? 'high' : 'medium', type: 'match_winner', probability: probs.win1X2.away, selectionSide: 'away' });
    if (probs.doubleChance.homeDraw > 75) tips.push({ title: `Casa ou Empate`, description: `Dificilmente o mandante perde.`, confidence: 'high', type: 'match_winner', probability: probs.doubleChance.homeDraw, selectionSide: 'home' });
    if (probs.doubleChance.drawAway > 75) tips.push({ title: `Empate ou Fora`, description: `Visitante resistente.`, confidence: 'high', type: 'match_winner', probability: probs.doubleChance.drawAway, selectionSide: 'away' });

    // Goals
    probs.goals.forEach(g => {
      if (g.line >= 1.5 && g.line <= 3.5) {
        if (g.over > 60) tips.push({ title: `Over ${g.line} Gols`, description: `Equipes com tendência ofensiva.`, confidence: g.over > 78 ? 'high' : 'medium', type: 'goals', probability: g.over, selectionLine: g.line, selectionSide: 'over' });
        if (g.under > 60) tips.push({ title: `Under ${g.line} Gols`, description: `Perfil defensivo neste confronto.`, confidence: g.under > 78 ? 'high' : 'medium', type: 'goals', probability: g.under, selectionLine: g.line, selectionSide: 'under' });
      }
    });

    // BTTS
    if (probs.btts.yes > 55) tips.push({ title: 'Ambas Marcam: Sim', description: `Ataques ativos dos dois lados.`, confidence: probs.btts.yes > 75 ? 'high' : 'medium', type: 'goals', probability: probs.btts.yes, selectionSide: 'yes' });
    if (probs.btts.no > 60) tips.push({ title: 'Ambas Marcam: Não', description: `Pelo menos uma defesa sólida.`, confidence: probs.btts.no > 78 ? 'high' : 'medium', type: 'goals', probability: probs.btts.no, selectionSide: 'no' });

    // Corners
    probs.corners.forEach(c => {
      if (c.over > 58) tips.push({ title: `Over ${c.line} Cantos`, description: `Tendência de jogo aberto.`, confidence: c.over > 75 ? 'high' : 'medium', type: 'corners', probability: c.over, selectionLine: c.line, selectionSide: 'over' });
      if (c.under > 60 && c.line >= 9.5) tips.push({ title: `Under ${c.line} Cantos`, description: `Jogo mais contido.`, confidence: c.under > 78 ? 'high' : 'medium', type: 'corners', probability: c.under, selectionLine: c.line, selectionSide: 'under' });
    });

    // Cards
    probs.cards.forEach(c => {
      if (c.over > 58) tips.push({ title: `Over ${c.line} Cartões`, description: `Jogo com potencial de faltas.`, confidence: c.over > 78 ? 'high' : 'medium', type: 'cards', probability: c.over, selectionLine: c.line, selectionSide: 'over' });
    });
  }

  // Sort by weighted score (confidence + probability) and return top 6
  return tips
    .sort((a, b) => {
      const confWeight = (c: string) => c === 'high' ? 1.3 : c === 'medium' ? 1 : 0.7;
      const scoreA = (a.probability || 70) * confWeight(a.confidence);
      const scoreB = (b.probability || 70) * confWeight(b.confidence);
      return scoreB - scoreA;
    })
    .slice(0, 6);
}

export function MatchCard({ match }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [probs, setProbs] = useState<MarketProbabilities | null>(null);
  const [mlData, setMlData] = useState<any>(null);
  const [hasData, setHasData] = useState(true);
  const [activeTab, setActiveTab] = useState<'probs' | 'stats'>('probs');
  const isLive = match.status.type.state === 'in';
  const isFinished = match.status.type.state === 'post';
  const bettingTips = React.useMemo(() => getBettingTips(match, probs), [match, probs]);
  const betBuilders = React.useMemo(() => getBetBuilders(probs, mlData), [probs, mlData]);
  const topTip = bettingTips[0] || null;
  const homeCorners = parseInt(match.homeTeam.stats?.corners || '0');
  const awayCorners = parseInt(match.awayTeam.stats?.corners || '0');
  const totalCorners = homeCorners + awayCorners;
  const hasCorners = match.homeTeam.stats?.corners !== undefined && (homeCorners > 0 || awayCorners > 0 || isLive || isFinished);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isFinished || probs || !hasData) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const fetchProbs = async () => {
          try {
            const [homeStats, awayStats] = await Promise.all([getTeamStats(match.homeTeam.name), getTeamStats(match.awayTeam.name)]);
            if (homeStats.length > 0 || awayStats.length > 0) {
              setProbs(calculateFullProbabilities(homeStats, awayStats, match.homeTeam.name, match.awayTeam.name));
              const correlations = await analyzeHistoricalCorrelations(homeStats, awayStats);
              setMlData(correlations);
            }
            else { setHasData(false); }
          } catch { setHasData(false); }
        };
        fetchProbs();
        if (cardRef.current) observer.unobserve(cardRef.current);
      }
    }, { rootMargin: '100px' });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => { if (cardRef.current) observer.unobserve(cardRef.current); };
  }, [isFinished, match.homeTeam.name, match.awayTeam.name, hasData, probs]);

  const loadStats = async () => {
    if (probs || hasData === false) { setExpanded(!expanded); return; }
    setLoading(true); setExpanded(true);
    try {
      const [homeStats, awayStats] = await Promise.all([getTeamStats(match.homeTeam.name), getTeamStats(match.awayTeam.name)]);
      if (homeStats.length === 0 && awayStats.length === 0) { setHasData(false); }
      else { setProbs(calculateFullProbabilities(homeStats, awayStats, match.homeTeam.name, match.awayTeam.name)); setHasData(true); }
    } catch { setHasData(false); }
    finally { setLoading(false); }
  };

  const handleShare = (e: React.MouseEvent, builder: BetBuilder) => {
    e.stopPropagation();
    const text = `🔥 ${match.homeTeam.name} vs ${match.awayTeam.name}\n${builder.emoji} ${builder.label}\n` + builder.selections.map(s => `✅ ${s.title} (${s.probability.toFixed(0)}%)`).join('\n') + `\n📈 Prob: ${builder.totalProbability.toFixed(1)}%\nCornerStats Pro`;
    if (navigator.share) { navigator.share({ title: 'CornerStats Pro', text, url: window.location.href }).catch(console.error); }
    else { navigator.clipboard.writeText(text); }
  };

  const fmtPct = (v: number) => v === 0 ? '-' : v.toFixed(1) + '%';
  const pctColor = (p: number) => p >= 70 ? 'text-emerald-400 font-bold' : p >= 50 ? 'text-emerald-500/80 font-medium' : p >= 30 ? 'text-amber-400' : 'text-rose-400';
  const barColor = (p: number) => p >= 70 ? 'bg-emerald-500' : p >= 50 ? 'bg-emerald-600/80' : p >= 30 ? 'bg-amber-500' : 'bg-rose-500';
  const confColor = (c: string) => c === 'high' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15' : c === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/15' : 'text-slate-400 bg-slate-500/10 border-slate-500/15';
  const confLabel = (c: string) => c === 'high' ? 'Alta' : c === 'medium' ? 'Média' : 'Baixa';
  const typeIcon = (t: string) => t === 'goals' ? <SoccerBall size={12} /> : t === 'corners' ? <CornerFlag size={12} /> : t === 'cards' ? <YellowCard size={12} /> : <Crosshair size={12} />;
  const typeLabel = (t: string) => t === 'goals' ? 'Gols' : t === 'corners' ? 'Cantos' : t === 'cards' ? 'Cartões' : 'Resultado';
  const builderIcon = (icon: string) => {
    switch (icon) {
      case 'goals': return <SoccerBall size={18} className="text-white/90" />;
      case 'defense': return <ShieldIcon size={18} className="text-white/90" />;
      case 'corners': return <CornerFlag size={18} className="text-white/90" />;
      case 'home': return <HomeTeam size={18} className="text-white/90" />;
      case 'cards': return <YellowCard size={18} className="text-white/90" />;
      case 'balance': return <BalanceScale size={18} className="text-white/90" />;
      case 'brain': return <BrainInsight size={18} className="text-white/90" />;
      default: return <AnalyticsChart size={18} className="text-white/90" />;
    }
  };
  const riskColor = (r: string) => r === 'safe' ? 'from-emerald-600 to-teal-700' : r === 'balanced' ? 'from-blue-600 to-indigo-700' : 'from-orange-600 to-rose-700';
  const riskBorder = (r: string) => r === 'safe' ? 'border-emerald-500/20' : r === 'balanced' ? 'border-blue-500/20' : 'border-orange-500/20';
  const riskText = (r: string) => r === 'safe' ? 'text-emerald-400' : r === 'balanced' ? 'text-blue-400' : 'text-orange-400';
  const riskBg = (r: string) => r === 'safe' ? 'bg-emerald-500/10' : r === 'balanced' ? 'bg-blue-500/10' : 'bg-orange-500/10';

  const isRec = (type: string, side?: string, line?: number) => {
    return bettingTips.some(tip => {
      if (tip.type !== type) return false;
      if (line !== undefined && tip.selectionLine !== undefined && tip.selectionLine !== line) return false;
      if (side !== undefined && tip.selectionSide !== undefined && tip.selectionSide !== side) return false;
      return true;
    });
  };

  const renderStatRow = (label: string, homeVal: string = '0', awayVal: string = '0', suffix: string = '') => {
    const hN = parseInt(homeVal) || 0, aN = parseInt(awayVal) || 0, t = hN + aN;
    const hP = t > 0 ? (hN / t) * 100 : 50, aP = t > 0 ? (aN / t) * 100 : 50;
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-200 w-10 text-center">{homeVal}{suffix}</span>
          <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">{label}</span>
          <span className="font-bold text-slate-200 w-10 text-center">{awayVal}{suffix}</span>
        </div>
        <div className="flex h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${hP}%` }} transition={{ duration: 1, ease: "easeOut" }} className="bg-emerald-500 h-full" />
          <motion.div initial={{ width: 0 }} animate={{ width: `${aP}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.1 }} className="bg-slate-500 h-full" />
        </div>
      </div>
    );
  };

  return (
    <motion.div ref={cardRef} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className="glow-card rounded-2xl overflow-hidden group relative will-change-transform">

      {/* Card Header — Click to expand */}
      <div className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10" onClick={loadStats}>
        <div className="flex items-center gap-5 w-full sm:w-auto">
          {/* Time/Status badge */}
          <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-900/60 backdrop-blur-md rounded-xl shrink-0 relative overflow-hidden border border-slate-700/40">
            {isLive && (<>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
            </>)}
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", isLive ? "text-rose-400" : isFinished ? "text-slate-500" : "text-slate-300")}>
              {isLive ? 'Live' : isFinished ? 'Fim' : format(new Date(match.date), 'HH:mm')}
            </span>
            <span className={cn("text-[9px] mt-0.5 text-center px-1 truncate w-full font-medium", isLive ? "text-rose-400/70" : "text-slate-600")}>
              {match.status.type.shortDetail}
            </span>
          </div>

          {/* Teams */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <img src={match.homeTeam.logo || ''} alt="" className="w-7 h-7 object-contain drop-shadow-md" referrerPolicy="no-referrer" />
              <span className="font-semibold text-slate-200 text-sm sm:text-base tracking-tight">{match.homeTeam.name}</span>
              <div className="ml-auto flex items-center gap-2 sm:gap-4">
                {hasCorners && <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/30"><CornerFlag size={10} />{homeCorners}</span>}
                {match.homeTeam.score && <span className={cn("font-bold text-lg w-6 text-center tabular-nums", isLive ? "text-rose-400" : "text-slate-100")}>{match.homeTeam.score}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <img src={match.awayTeam.logo || ''} alt="" className="w-7 h-7 object-contain drop-shadow-md" referrerPolicy="no-referrer" />
              <span className="font-semibold text-slate-200 text-sm sm:text-base tracking-tight">{match.awayTeam.name}</span>
              <div className="ml-auto flex items-center gap-2 sm:gap-4">
                {hasCorners && <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/30"><CornerFlag size={10} />{awayCorners}</span>}
                {match.awayTeam.score && <span className={cn("font-bold text-lg w-6 text-center tabular-nums", isLive ? "text-rose-400" : "text-slate-100")}>{match.awayTeam.score}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Right side — badges & expand */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-700/30">
          <div className="flex flex-col gap-2 items-end sm:items-start pl-0 sm:pl-5 sm:border-l border-slate-700/30">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800/60 px-2.5 py-1 rounded-lg w-fit border border-slate-700/30 backdrop-blur-md">
              {match.league.logo && <img src={match.league.logo} alt="" className="w-3 h-3 object-contain" referrerPolicy="no-referrer" />}
              <span className="truncate max-w-[120px]">{match.league.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end sm:justify-start">
              {hasCorners && <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10"><CornerFlag size={9} /><span>{totalCorners}</span></div>}
              {topTip && !expanded && hasData && <div className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/10 animate-pulse"><LightningBolt size={9} className="text-cyan-400" /><span className="uppercase tracking-tight">{bettingTips.length > 1 ? `${bettingTips.length} oportunidades` : topTip.title}</span></div>}
              {betBuilders.length > 0 && !expanded && hasData && <div className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/10"><StackLayers size={9} /><span className="uppercase tracking-tight">{betBuilders.length} múltiplas</span></div>}
            </div>
          </div>
          <button className="p-2 text-slate-500 hover:text-emerald-400 rounded-lg transition-all active:scale-95">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}><ChevronDown size={20} /></motion.div>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
            <div className="border-t border-slate-700/40 bg-slate-900/40 backdrop-blur-2xl p-4 sm:p-6 relative">
              <div className="relative z-10 w-full">

                {/* Oportunidades — Grid of all tips */}
                {bettingTips.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <LightningBolt size={14} className="text-yellow-400" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Oportunidades ({bettingTips.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {bettingTips.map((tip, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}
                          className="bg-slate-800/60 rounded-xl border border-slate-700/30 p-3.5 hover:border-emerald-500/20 transition-all group/tip">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border", confColor(tip.confidence))}>
                                {tip.confidence === 'high' && <StarIcon size={8} className="text-current" />}
                                {confLabel(tip.confidence)}
                              </span>
                              <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded border border-slate-600/20">
                                {typeIcon(tip.type)} {typeLabel(tip.type)}
                              </span>
                            </div>
                            {tip.probability && (
                              <span className={cn("text-lg font-extrabold tabular-nums tracking-tight", pctColor(tip.probability))}>{tip.probability.toFixed(0)}%</span>
                            )}
                          </div>
                          <h5 className="text-sm font-bold text-slate-100 mb-0.5 tracking-tight">{tip.title}</h5>
                          <p className="text-[11px] text-slate-500 leading-snug">{tip.description}</p>
                          {tip.probability && (
                            <div className="mt-2 h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${tip.probability}%` }} transition={{ duration: 0.8, delay: 0.1 * idx }}
                                className={cn("h-full rounded-full", barColor(tip.probability))} />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Múltiplas — Multiple bet builders */}
                {betBuilders.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <StackLayers size={14} className="text-amber-400" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Múltiplas Sugeridas ({betBuilders.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {betBuilders.map((builder, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }}
                          className={cn("relative overflow-hidden rounded-xl bg-slate-800/60 border group/builder hover:scale-[1.02] transition-transform", riskBorder(builder.riskLevel))}>
                          {/* Header */}
                          <div className={cn("bg-gradient-to-br p-3 flex items-center gap-2.5 text-white", riskColor(builder.riskLevel))}>
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm flex-shrink-0">{builderIcon(builder.icon)}</div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-bold block flex items-center gap-1.5">
                                {builder.label}
                                {builder.mlScore && builder.mlScore.averageLift > 1.1 && (
                                  <span title={`Correlação positivia IA (+${((builder.mlScore.averageLift - 1) * 100).toFixed(0)}%)`} className="bg-white/20 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm border border-white/20">
                                    <BrainInsight size={10} className="text-white relative top-[-0.5px]" />
                                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-white">IA</span>
                                  </span>
                                )}
                              </span>
                              <span className="text-[9px] opacity-80 font-medium">{builder.selections.length} seleções</span>
                            </div>
                            <div className="ml-auto text-right flex-shrink-0">
                              <span className="text-[9px] opacity-70 font-bold uppercase tracking-wider block">Prob.</span>
                              <span className="text-xl font-extrabold">{builder.totalProbability.toFixed(1)}%</span>
                            </div>
                          </div>
                          {/* Reasoning */}
                          <div className="px-3 pt-2.5 pb-1">
                            <p className="text-[9px] text-slate-400 leading-relaxed italic border-l-2 border-slate-600/50 pl-2">{builder.reasoning}</p>
                          </div>
                          {/* Selections */}
                          <div className="p-3 flex flex-col gap-1.5">
                            {builder.selections.map((sel, sIdx) => (
                              <div key={sIdx} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-700/30 rounded-lg border border-slate-600/20">
                                <div className="flex items-center gap-2">
                                  <span className={cn("w-1.5 h-1.5 rounded-full", riskBg(builder.riskLevel))} style={{ boxShadow: `0 0 4px currentColor` }} />
                                  <span className="font-semibold text-slate-200">{sel.title}</span>
                                </div>
                                <span className={cn("font-bold text-[11px] tabular-nums", pctColor(sel.probability))}>{sel.probability.toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                          {/* Share button */}
                          <div className="px-3 pb-3">
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={(e) => handleShare(e, builder)}
                              className={cn("w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border", riskText(builder.riskLevel), riskBg(builder.riskLevel), riskBorder(builder.riskLevel))}>
                              <ShareIcon size={11} />Compartilhar
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-5 mb-5 border-b border-slate-700/40">
                  <button onClick={() => setActiveTab('probs')} className={cn("pb-2.5 text-sm font-semibold transition-colors relative", activeTab === 'probs' ? "text-emerald-400" : "text-slate-500 hover:text-slate-300")}>
                    <div className="flex items-center gap-1.5"><AnalyticsChart size={14} />Probabilidades</div>
                    {activeTab === 'probs' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
                  </button>
                  {(isLive || isFinished) && (
                    <button onClick={() => setActiveTab('stats')} className={cn("pb-2.5 text-sm font-semibold transition-colors relative", activeTab === 'stats' ? "text-emerald-400" : "text-slate-500 hover:text-slate-300")}>
                      <div className="flex items-center gap-1.5"><Crosshair size={14} />Estatísticas</div>
                      {activeTab === 'stats' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                    {activeTab === 'probs' ? (
                      <>
                        {loading ? (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                            <SpinnerIcon size={28} className="mb-2 text-emerald-500" />
                            <p className="text-xs font-medium">Processando dados...</p>
                          </div>
                        ) : !hasData || !probs ? (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/30">
                            <WarningCircle size={28} className="mb-2 text-slate-600" />
                            <p className="text-xs font-medium">Dados insuficientes.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {/* Main Markets */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* 1X2 */}
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/30 p-4">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendUp size={12} />Resultado 1X2</h5>
                                <div className="flex items-center gap-0.5 h-12 w-full rounded-xl overflow-hidden bg-slate-900/50 border border-slate-700/30 relative">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${probs.win1X2.home}%` }} transition={{ duration: 1, ease: "easeOut" }}
                                    className={cn("h-full bg-gradient-to-b from-emerald-500 to-emerald-700 flex flex-col items-center justify-center relative group", isRec('match_winner', 'home') && "ring-1 ring-cyan-400 z-10 shadow-[0_0_12px_rgba(6,182,212,0.3)]")}>
                                    <span className="text-sm font-bold text-white drop-shadow-sm">{probs.win1X2.home.toFixed(0)}%</span>
                                    <span className="text-[8px] text-emerald-200 font-bold uppercase tracking-wider">Casa</span>
                                  </motion.div>
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${probs.win1X2.draw}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                                    className={cn("h-full bg-slate-600 flex flex-col items-center justify-center relative group", isRec('match_winner', 'draw') && "ring-1 ring-cyan-400 z-10")}>
                                    <span className="text-sm font-bold text-white">{probs.win1X2.draw.toFixed(0)}%</span>
                                    <span className="text-[8px] text-slate-300 font-bold uppercase tracking-wider">Emp.</span>
                                  </motion.div>
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${probs.win1X2.away}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                    className={cn("h-full bg-gradient-to-b from-cyan-500 to-cyan-700 flex flex-col items-center justify-center relative group", isRec('match_winner', 'away') && "ring-1 ring-cyan-400 z-10 shadow-[0_0_12px_rgba(6,182,212,0.3)]")}>
                                    <span className="text-sm font-bold text-white drop-shadow-sm">{probs.win1X2.away.toFixed(0)}%</span>
                                    <span className="text-[8px] text-cyan-200 font-bold uppercase tracking-wider">Fora</span>
                                  </motion.div>
                                </div>
                              </motion.div>

                              {/* BTTS */}
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/50 rounded-xl border border-slate-700/30 p-4">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Ambas Marcam</h5>
                                <div className="space-y-2.5">
                                  {[{ label: 'Sim', val: probs.btts.yes, side: 'yes' }, { label: 'Não', val: probs.btts.no, side: 'no' }].map(item => (
                                    <div key={item.label}>
                                      <div className="flex justify-between text-xs mb-1"><span className="text-slate-400 font-medium">{item.label}</span><span className={cn("font-bold", pctColor(item.val))}>{fmtPct(item.val)}</span></div>
                                      <div className={cn("h-2 w-full bg-slate-700/50 rounded-full", isRec('goals', item.side) && "ring-1 ring-cyan-400 ring-offset-1 ring-offset-slate-900")}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} transition={{ duration: 1 }} className={cn("h-full rounded-full", barColor(item.val))} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>

                              {/* First Goal */}
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-800/50 rounded-xl border border-slate-700/30 p-4">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Primeiro Gol</h5>
                                <div className="space-y-2">
                                  {[{ label: 'Casa', val: probs.firstGoal.home }, { label: 'Fora', val: probs.firstGoal.away }, { label: 'Sem Gol', val: probs.firstGoal.none }].map(item => (
                                    <div key={item.label} className="flex items-center gap-2">
                                      <span className="text-[10px] font-medium text-slate-500 w-12">{item.label}</span>
                                      <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} transition={{ duration: 1 }} className={cn("h-full rounded-full", barColor(item.val))} />
                                      </div>
                                      <span className={cn("text-[10px] font-bold w-10 text-right", pctColor(item.val))}>{fmtPct(item.val)}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>

                              {/* Double Chance */}
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="md:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/30 p-4">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Dupla Chance</h5>
                                <div className="grid grid-cols-3 gap-2">
                                  {[{ label: 'Casa ou Emp.', val: probs.doubleChance.homeDraw }, { label: 'Casa ou Fora', val: probs.doubleChance.homeAway }, { label: 'Emp. ou Fora', val: probs.doubleChance.drawAway }].map(item => (
                                    <div key={item.label} className="bg-slate-700/30 rounded-lg p-2.5 text-center border border-slate-700/20">
                                      <span className="text-[10px] text-slate-500 font-medium block mb-0.5">{item.label}</span>
                                      <span className={cn("text-base font-bold", pctColor(item.val))}>{fmtPct(item.val)}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            </div>

                            {/* Secondary Markets */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Goals */}
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-slate-800/50 rounded-xl border border-slate-700/30 p-3.5">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5"><SoccerBall size={12} className="text-emerald-500" />Gols</h5>
                                <div className="space-y-3">
                                  {probs.goals.map(g => (
                                    <div key={g.line} className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-medium text-slate-400">{g.line} Gols</span>
                                      <div className={cn("flex h-1.5 w-full bg-slate-700/50 rounded-full", isRec('goals', 'over', g.line) && "ring-1 ring-cyan-400 ring-offset-1 ring-offset-slate-900")}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${g.over}%` }} transition={{ duration: 1 }} className={cn("h-full rounded-full", barColor(g.over))} />
                                      </div>
                                      <div className="flex justify-between text-[9px] text-slate-500"><span>Over: <span className={cn("font-bold", pctColor(g.over))}>{g.over.toFixed(0)}%</span></span><span>Under: <span className="font-medium text-slate-500">{g.under.toFixed(0)}%</span></span></div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>

                              {/* Corners */}
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-slate-800/50 rounded-xl border border-slate-700/30 p-3.5">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5"><CornerFlag size={12} className="text-emerald-500" />Escanteios</h5>
                                <div className="space-y-3">
                                  {probs.corners.map(c => (
                                    <div key={c.line} className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-medium text-slate-400">{c.line} Cantos</span>
                                      <div className={cn("flex h-1.5 w-full bg-slate-700/50 rounded-full", isRec('corners', 'over', c.line) && "ring-1 ring-cyan-400 ring-offset-1 ring-offset-slate-900")}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${c.over}%` }} transition={{ duration: 1 }} className={cn("h-full rounded-full", barColor(c.over))} />
                                      </div>
                                      <div className="flex justify-between text-[9px] text-slate-500"><span>Over: <span className={cn("font-bold", pctColor(c.over))}>{c.over.toFixed(0)}%</span></span><span>Under: <span className="font-medium text-slate-500">{c.under.toFixed(0)}%</span></span></div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>

                              {/* Cards */}
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-slate-800/50 rounded-xl border border-slate-700/30 p-3.5">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5"><YellowCard size={12} className="text-emerald-500" />Cartões</h5>
                                <div className="space-y-3">
                                  {probs.cards.map(c => (
                                    <div key={c.line} className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-medium text-slate-400">{c.line} Cartões</span>
                                      <div className={cn("flex h-1.5 w-full bg-slate-700/50 rounded-full", isRec('cards', 'over', c.line) && "ring-1 ring-cyan-400 ring-offset-1 ring-offset-slate-900")}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${c.over}%` }} transition={{ duration: 1 }} className={cn("h-full rounded-full", barColor(c.over))} />
                                      </div>
                                      <div className="flex justify-between text-[9px] text-slate-500"><span>Over: <span className={cn("font-bold", pctColor(c.over))}>{c.over.toFixed(0)}%</span></span><span>Under: <span className="font-medium text-slate-500">{c.under.toFixed(0)}%</span></span></div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            </div>

                            {/* Handicap */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-slate-800/50 rounded-xl border border-slate-700/30 p-4">
                              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Handicap Asiático</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {probs.handicap.map(h => (
                                  <div key={h.line} className="flex items-center justify-between text-xs p-2.5 bg-slate-700/30 rounded-lg border border-slate-700/20 hover:border-emerald-500/20 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-slate-500 font-medium text-[10px]">Casa ({h.line > 0 ? `+${h.line}` : h.line})</span>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-14 h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${h.home}%` }} transition={{ duration: 1 }} className={cn("h-full rounded-full", barColor(h.home))} />
                                        </div>
                                        <span className={cn("font-bold text-[10px]", pctColor(h.home))}>{fmtPct(h.home)}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5 items-end">
                                      <span className="text-slate-500 font-medium text-[10px]">Fora ({h.line > 0 ? `-${h.line}` : `+${Math.abs(h.line)}`})</span>
                                      <div className="flex items-center gap-1.5 flex-row-reverse">
                                        <div className="w-14 h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${h.away}%` }} transition={{ duration: 1 }} className={cn("h-full rounded-full", barColor(h.away))} />
                                        </div>
                                        <span className={cn("font-bold text-[10px]", pctColor(h.away))}>{fmtPct(h.away)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-slate-800/50 rounded-xl border border-slate-700/30 p-4 flex flex-col gap-4">
                        {renderStatRow('Posse de Bola', match.homeTeam.stats?.possession, match.awayTeam.stats?.possession, '%')}
                        {renderStatRow('Finalizações', match.homeTeam.stats?.shots, match.awayTeam.stats?.shots)}
                        {renderStatRow('Chutes no Alvo', match.homeTeam.stats?.shotsOnTarget, match.awayTeam.stats?.shotsOnTarget)}
                        {renderStatRow('Escanteios', match.homeTeam.stats?.corners, match.awayTeam.stats?.corners)}
                        {renderStatRow('Faltas', match.homeTeam.stats?.fouls, match.awayTeam.stats?.fouls)}
                        {renderStatRow('C. Amarelos', match.homeTeam.stats?.yellowCards, match.awayTeam.stats?.yellowCards)}
                        {renderStatRow('C. Vermelhos', match.homeTeam.stats?.redCards, match.awayTeam.stats?.redCards)}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
