import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=20240302');
  const data = await res.json();
  if (data.events && data.events.length > 0) {
    const event = data.events[0];
    const homeCompetitor = event.competitions[0].competitors.find((c) => c.homeAway === 'home');
    console.log(homeCompetitor.statistics.map(s => s.name));
  }
}

test();
