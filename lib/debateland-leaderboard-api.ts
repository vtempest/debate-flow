import grab from 'grab-url';
import { parseHTML } from 'linkedom';

/**
 * Configuration for a debate division dataset
 */
interface DatasetConfig {
    division: string;
    url: string;
}

/**
 * Extracted rank and team information from a table cell
 */
interface RankAndTeam {
    rank: number | null;
    rankRaw: string;
    teamSchool: string;
}

/**
 * Leaderboard entry for a debate team
 */
interface LeaderboardEntry {
    rank: number | string;
    teamSchool: string;
    values: (number | string | null)[];
}

/**
 * Gets the dataset configurations for debate divisions
 * @param {string} [year='2026'] - The competition year
 * @returns {DatasetConfig[]} Array of dataset configurations
 */
function getDatasets(year: string = '2026'): DatasetConfig[] {
    return [
        {
            division: 'VPF',
            url: `https://www.debate.land/datasets/${year}-national-varsity-public-forum/leaderboard?page=1&size=100`,
        },
        {
            division: 'VLD',
            url: `https://www.debate.land/datasets/${year}-national-varsity-lincoln-douglas/leaderboard?page=1&size=100`,
        },
    ];
}

/**
 * Extracts rank and team information from a table cell
 * @param {Element | null} firstTd - The first table cell element containing rank and team data
 * @returns {RankAndTeam} Extracted rank and team information
 */
function extractRankAndTeam(firstTd: Element | null): RankAndTeam {
    if (!firstTd) return { rank: null, rankRaw: '', teamSchool: '' };

    // Get all text in the first cell (rank + team + labels)
    const raw = firstTd.textContent || '';
    const text = raw.replace(/\s+/g, ' ').trim();

    let rank: number | null = null;
    let rankRaw = '';
    let teamSchool = '';

    const hashMatch = text.match(/#\s*(\d+)/);
    if (hashMatch) {
        rankRaw = hashMatch[0];
        rank = Number(hashMatch[1]);
        teamSchool = text.slice(hashMatch.index! + hashMatch[0].length).trim();
    } else {
        // fallback: first integer as rank
        const numMatch = text.match(/\b(\d+)\b/);
        if (numMatch) {
            rankRaw = numMatch[0];
            rank = Number(numMatch[1]);
            teamSchool = text.slice(numMatch.index! + numMatch[0].length).trim();
        } else {
            // no number; treat entire text as teamSchool
            teamSchool = text;
        }
    }

    // Clean off common trailing labels like "TOC", "NSD", etc.
    teamSchool = teamSchool
        .replace(/\bTOC\b.*$/i, '')     // drop everything from "TOC" onwards
        .replace(/\s+/g, ' ')
        .trim();

    return { rank, rankRaw, teamSchool };
}

/**
 * Scrapes leaderboard data for a specific debate division
 * @param {DatasetConfig} config - Dataset configuration containing division and URL
 * @returns {Promise<LeaderboardEntry[]>} Array of leaderboard entries
 */
async function scrapeDivision({ division, url }: DatasetConfig): Promise<LeaderboardEntry[]> {
    const html = await grab(url);

    const { document } = parseHTML(html.data);

    const rows = document.querySelectorAll('tbody tr.group');

    const out = Array.from(rows).map((tr: Element) => {
        const tds = Array.from(tr.querySelectorAll('td'));

        const firstTd = tds[0];

        // GENERALIZED rank + team extraction from full cell text
        const { rank, rankRaw, teamSchool } = extractRankAndTeam(firstTd);

        const valueTds = tds.slice(1);
        const values = valueTds.map(td => {
            const txt = td.textContent?.trim() || '';
            if (!txt || txt === '--') return null;

            const numericCandidate = txt.replace(/[^\d.-]/g, '');
            const num = Number(numericCandidate);

            if (txt.includes('%') || txt.includes('-') || Number.isNaN(num)) {
                return txt;
            }
            return num;
        });

        return {
            rank: rank ?? rankRaw, // prefer numeric, fall back to raw string
            teamSchool,
            values,
        };
    }).filter(entry => entry.values.length > 0);

    return out;
}

/**
 * Scrapes leaderboard data for all configured debate divisions
 * @param {string} [year='2026'] - The competition year to scrape data for
 * @returns {Promise<LeaderboardEntry[]>} Combined array of all leaderboard entries
 */
async function scrapeAll(year: string = '2026'): Promise<LeaderboardEntry[]> {
    const datasets = getDatasets(year);
    const all: LeaderboardEntry[] = [];

    for (const cfg of datasets) {
        all.push(...(await scrapeDivision(cfg)));
    }

    return all;
}

/**
 * Main execution: scrapes and logs all leaderboard data
 */
async function main() {
    const data = await scrapeAll();
    console.log(JSON.stringify(data, null, 2));
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

export { scrapeAll, scrapeDivision, getDatasets };
export type { LeaderboardEntry, DatasetConfig, RankAndTeam };
