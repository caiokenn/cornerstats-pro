import { format } from 'date-fns';
import { cacheService } from './cache';

export interface TeamStats {
  possession?: string;
  shots?: string;
  shotsOnTarget?: string;
  corners?: string;
  fouls?: string;
  yellowCards?: string;
  redCards?: string;
}

export interface ESPNMatch {
  id: string;
  date: string;
  name: string;
  shortName: string;
  homeTeam: {
    name: string;
    logo: string;
    score: string;
    stats?: TeamStats;
  };
  awayTeam: {
    name: string;
    logo: string;
    score: string;
    stats?: TeamStats;
  };
  league: {
    name: string;
    logo: string;
  };
  status: {
    type: {
      state: string;
      shortDetail: string;
    };
  };
}

const LEAGUES = [
  // South America
  'bra.1', 'bra.2', 'arg.1', 'col.1', 'chi.1', 'conmebol.libertadores', 'conmebol.sudamericana',
  // Europe
  'eng.1', 'eng.2', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'por.1', 'ned.1', 'bel.1', 'tur.1',
  'uefa.champions', 'uefa.europa', 'uefa.europa.conf',
  // North America
  'usa.1', 'mex.1',
  // Asia
  'jpn.1', 'ksa.1'
];

const parseStats = (statistics?: any[], details?: any[], teamId?: string): TeamStats | undefined => {
  if (!statistics || statistics.length === 0) return undefined;
  const getStat = (name: string) => statistics.find((s: any) => s.name === name)?.displayValue;
  
  let yellowCards = 0;
  let redCards = 0;
  
  if (details && teamId) {
    details.forEach((d: any) => {
      if (d.team?.id === teamId) {
        if (d.yellowCard) yellowCards++;
        if (d.redCard) redCards++;
      }
    });
  }

  return {
    possession: getStat('possessionPct') || '0',
    shots: getStat('totalShots') || getStat('shotsSummary') || '0',
    shotsOnTarget: getStat('shotsOnTarget') || '0',
    corners: getStat('wonCorners') || getStat('cornerKicks') || '0',
    fouls: getStat('foulsCommitted') || '0',
    yellowCards: getStat('yellowCards') || yellowCards.toString(),
    redCards: getStat('redCards') || redCards.toString(),
  };
};

export async function fetchMatchesByDate(date: Date): Promise<ESPNMatch[]> {
  const formattedDate = format(date, 'yyyyMMdd');
  const cacheKey = `espn_matches_${formattedDate}`;
  
  const cachedData = cacheService.get(cacheKey);
  if (cachedData) return cachedData;
  
  try {
    const promises = LEAGUES.map(league => 
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${formattedDate}`)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
    );
    
    const results = await Promise.all(promises);
    const allEvents: ESPNMatch[] = [];
    
    results.forEach(data => {
      if (!data || !data.events) return;
      
      const leagueName = data.leagues?.[0]?.name || 'Futebol';
      const leagueLogo = data.leagues?.[0]?.logos?.[0]?.href || '';
      
      data.events.forEach((event: any) => {
        const homeCompetitor = event.competitions[0].competitors.find((c: any) => c.homeAway === 'home');
        const awayCompetitor = event.competitions[0].competitors.find((c: any) => c.homeAway === 'away');
        
        const details = event.competitions[0].details;
        
        allEvents.push({
          id: event.id,
          date: event.date,
          name: event.name,
          shortName: event.shortName,
          league: {
            name: leagueName,
            logo: leagueLogo,
          },
          homeTeam: {
            name: homeCompetitor.team.name,
            logo: homeCompetitor.team.logo,
            score: homeCompetitor.score,
            stats: parseStats(homeCompetitor.statistics, details, homeCompetitor.team.id),
          },
          awayTeam: {
            name: awayCompetitor.team.name,
            logo: awayCompetitor.team.logo,
            score: awayCompetitor.score,
            stats: parseStats(awayCompetitor.statistics, details, awayCompetitor.team.id),
          },
          status: event.status,
        });
      });
    });
    
    const sorted = allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Cache for 30 seconds if today, 1 hour if past/future
    const isToday = formattedDate === format(new Date(), 'yyyyMMdd');
    cacheService.set(cacheKey, sorted, isToday ? 10000 : 3600000);
    
    return sorted;
  } catch (error) {
    console.error('Error fetching ESPN matches:', error);
    return [];
  }
}
