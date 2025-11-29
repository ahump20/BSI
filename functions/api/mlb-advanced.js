import { ok, err, preflight, cache, withRetry, fetchWithTimeout } from './_utils.js'

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1'
const HEADSHOT_BASE =
  'https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,w_256,q_auto:best/v1/people'
const TEAM_LOGO_BASE = 'https://www.mlbstatic.com/team-logos'
const DEFAULT_CACHE_TTL = 1800

const LEAGUE_BASELINE = {
  season: 2024,
  wobaWeights: {
    walk: 0.688,
    hbp: 0.719,
    single: 0.879,
    double: 1.242,
    triple: 1.569,
    homer: 2.031
  },
  leagueWOBA: 0.31,
  wOBAScale: 1.21,
  leagueRunsPerPA: 0.115,
  runsPerWin: 9.6,
  replacementRunsPerPA: 20 / 600,
  fipConstant: 3.1,
  leagueERA: 4.3
}

const goldenAngle = Math.PI * (3 - Math.sqrt(5))

const SAVANT_CSV_ENDPOINT = 'https://baseballsavant.mlb.com/statcast_search/csv'

const formatDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null
  }

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const determineSeasonDateRange = (season) => {
  const numericSeason = Number(season) || LEAGUE_BASELINE.season
  const seasonStart = new Date(Date.UTC(numericSeason, 2, 1))
  const defaultSeasonEnd = new Date(Date.UTC(numericSeason, 10, 30))
  const today = new Date()

  let effectiveEnd = defaultSeasonEnd
  if (today.getUTCFullYear() === numericSeason) {
    if (today < seasonStart) {
      effectiveEnd = defaultSeasonEnd
    } else if (today > defaultSeasonEnd) {
      effectiveEnd = defaultSeasonEnd
    } else {
      effectiveEnd = today
    }
  }

  return {
    startDate: formatDate(seasonStart),
    endDate: formatDate(effectiveEnd)
  }
}

const buildStatcastRequestUrl = (playerId, startDate, endDate, role) => {
  const lookupKey = role === 'pitcher' ? 'pitchers' : 'batters'
  const playerType = role === 'pitcher' ? 'pitcher' : 'batter'

  return `${SAVANT_CSV_ENDPOINT}?all=true&hfPT=&hfAB=&hfBBT=&hfPR=&hfZ=&stadium=&hfBBL=&hfNewZones=&hfGT=R%7CPO%7CS%7C=&hfSea=&hfSit=&player_type=${playerType}&hfOuts=&opponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt=${startDate}&game_date_lt=${endDate}&${lookupKey}_lookup%5B%5D=${playerId}&team=&position=&hfRO=&home_road=&hfFlag=&metric_1=&hfInn=&min_pitches=0&min_results=0&group_by=name&sort_col=pitches&player_event_sort=h_launch_speed&sort_order=desc&min_abs=0&type=details&`
}

const parseCsvLine = (line) => {
  const values = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values.map((value) => value.trim())
}

const parseCsvText = (text) => {
  if (!text) {
    return []
  }

  const cleaned = text.replace(/\r/g, '').trim()
  if (!cleaned) {
    return []
  }

  const lines = cleaned.split('\n')
  if (lines.length <= 1) {
    return []
  }

  const headers = parseCsvLine(lines[0])
  return lines
    .slice(1)
    .filter((line) => line && line.trim())
    .map((line) => {
      const values = parseCsvLine(line)
      const record = {}
      headers.forEach((header, index) => {
        record[header] = values[index] ?? ''
      })
      return record
    })
}

const toFiniteNumber = (value) => {
  if (value === null || value === undefined) {
    return null
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const translateSprayCoordinates = (hcX, hcY) => {
  const x = (hcX - 125.42) / 1.143
  const y = (198.27 - hcY) / 1.143
  const distance = Math.sqrt(x * x + y * y)
  const sprayAngle = (Math.atan2(y, x) * 180) / Math.PI

  return {
    x: roundTo(x, 2),
    y: roundTo(y, 2),
    distance: roundTo(distance, 1),
    sprayAngle: roundTo(sprayAngle, 1)
  }
}

const normaliseBattedBallEvent = (event, bbType) => {
  const lowerEvent = (event || '').toLowerCase()
  const lowerType = (bbType || '').toLowerCase()

  if (lowerEvent.includes('home_run')) {
    return 'Home Run'
  }
  if (lowerEvent.includes('triple')) {
    return 'Triple'
  }
  if (lowerEvent.includes('double')) {
    return 'Double'
  }
  if (lowerEvent.includes('single')) {
    return 'Single'
  }
  if (lowerType.includes('line')) {
    return 'Lineout'
  }
  if (lowerType.includes('fly')) {
    return 'Flyout'
  }
  if (lowerType.includes('ground')) {
    return 'Groundout'
  }
  return event || bbType || 'In Play'
}

const buildVelocityBinsFromSpeeds = (speeds) => {
  if (!speeds || speeds.length === 0) {
    return []
  }

  const min = Math.floor(Math.min(...speeds))
  const max = Math.ceil(Math.max(...speeds))
  const bins = []

  for (let mph = min; mph <= max; mph += 1) {
    const lower = mph - 0.5
    const upper = mph + 0.5
    const density = speeds.reduce((total, speed) => (speed >= lower && speed < upper ? total + 1 : total), 0)
    if (density > 0) {
      bins.push({
        velocity: mph,
        density
      })
    }
  }

  return bins
}

const fetchStatcastDataset = async (playerId, season, role) => {
  if (!playerId || !season) {
    return []
  }

  const { startDate, endDate } = determineSeasonDateRange(season)
  if (!startDate || !endDate) {
    return []
  }

  const url = buildStatcastRequestUrl(playerId, startDate, endDate, role)

  try {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'BlazeSportsIntel-Statcast/1.0',
          Accept: 'text/csv'
        }
      },
      20000
    )

    if (!response.ok) {
      return []
    }

    const text = await response.text()
    if (!text || !text.trim() || text.startsWith('<!DOCTYPE')) {
      return []
    }

    return parseCsvText(text)
  } catch (error) {
    return []
  }
}

const summarizeStatcastBatter = (rows) => {
  if (!rows || rows.length === 0) {
    return null
  }

  let exitVelocitySum = 0
  let exitVelocityCount = 0
  let launchAngleSum = 0
  let launchAngleCount = 0
  let xwobaSum = 0
  let xwobaCount = 0
  let hardHitCount = 0
  let barrelCount = 0
  const sprayPoints = []

  rows.forEach((row) => {
    const exitVelocity = toFiniteNumber(row.launch_speed)
    const launchAngle = toFiniteNumber(row.launch_angle)
    const estimatedWoba = toFiniteNumber(row.estimated_woba_using_speedangle)
    const hcX = toFiniteNumber(row.hc_x)
    const hcY = toFiniteNumber(row.hc_y)

    if (exitVelocity !== null) {
      exitVelocitySum += exitVelocity
      exitVelocityCount += 1
      if (exitVelocity >= 95) {
        hardHitCount += 1
      }
    }

    if (launchAngle !== null) {
      launchAngleSum += launchAngle
      launchAngleCount += 1
    }

    if (exitVelocity !== null && launchAngle !== null && exitVelocity >= 98 && launchAngle >= 26 && launchAngle <= 42) {
      barrelCount += 1
    }

    if (estimatedWoba !== null) {
      xwobaSum += estimatedWoba
      xwobaCount += 1
    }

    if (hcX !== null && hcY !== null) {
      const coords = translateSprayCoordinates(hcX, hcY)
      sprayPoints.push({
        x: coords.x,
        y: coords.y,
        distance: coords.distance,
        sprayAngle: coords.sprayAngle,
        type: normaliseBattedBallEvent(row.events, row.bb_type),
        launchSpeed: exitVelocity !== null ? roundTo(exitVelocity, 1) : null,
        launchAngle: launchAngle !== null ? roundTo(launchAngle, 1) : null
      })
    }
  })

  const totalBattedBalls = sprayPoints.length

  return {
    sprayChart: {
      points: sprayPoints,
      totalBallsInPlay: totalBattedBalls
    },
    metrics: {
      avgExitVelocity: exitVelocityCount > 0 ? exitVelocitySum / exitVelocityCount : null,
      avgLaunchAngle: launchAngleCount > 0 ? launchAngleSum / launchAngleCount : null,
      xwOBA: xwobaCount > 0 ? xwobaSum / xwobaCount : null,
      hardHitRate: totalBattedBalls > 0 ? (hardHitCount / totalBattedBalls) * 100 : null,
      barrelRate: totalBattedBalls > 0 ? (barrelCount / totalBattedBalls) * 100 : null
    }
  }
}

const summarizeStatcastPitcher = (rows) => {
  if (!rows || rows.length === 0) {
    return null
  }

  const totalPitches = rows.length
  const byPitch = new Map()
  const velocities = []
  const spinRates = []

  rows.forEach((row) => {
    const pitchName = row.pitch_name || row.pitch_type || 'Unknown'
    if (!byPitch.has(pitchName)) {
      byPitch.set(pitchName, {
        pitch: pitchName,
        pitchType: row.pitch_type || '',
        count: 0,
        sumPfxX: 0,
        sumPfxZ: 0,
        breakCount: 0,
        sumVelocity: 0,
        velocityCount: 0,
        sumSpin: 0,
        spinCount: 0
      })
    }

    const bucket = byPitch.get(pitchName)
    bucket.count += 1

    const velocity = toFiniteNumber(row.release_speed)
    if (velocity !== null) {
      bucket.sumVelocity += velocity
      bucket.velocityCount += 1
      velocities.push(velocity)
    }

    const pfxX = toFiniteNumber(row.pfx_x)
    const pfxZ = toFiniteNumber(row.pfx_z)
    if (pfxX !== null || pfxZ !== null) {
      bucket.sumPfxX += pfxX ?? 0
      bucket.sumPfxZ += pfxZ ?? 0
      bucket.breakCount += 1
    }

    const spin = toFiniteNumber(row.release_spin_rate)
    if (spin !== null) {
      bucket.sumSpin += spin
      bucket.spinCount += 1
      spinRates.push(spin)
    }
  })

  const pitchSummaries = Array.from(byPitch.values())
    .map((bucket) => ({
      pitch: bucket.pitch,
      pitchType: bucket.pitchType,
      horizontalBreak:
        bucket.breakCount > 0 ? roundTo((bucket.sumPfxX / bucket.breakCount) * 12, 2) : 0,
      verticalBreak:
        bucket.breakCount > 0 ? roundTo((bucket.sumPfxZ / bucket.breakCount) * 12, 2) : 0,
      velocity:
        bucket.velocityCount > 0 ? roundTo(bucket.sumVelocity / bucket.velocityCount, 1) : null,
      usage: roundTo((bucket.count / totalPitches) * 100, 1),
      spinRate: bucket.spinCount > 0 ? Math.round(bucket.sumSpin / bucket.spinCount) : null
    }))
    .sort((a, b) => (b.usage || 0) - (a.usage || 0))

  const avgVelocity = velocities.length > 0
    ? velocities.reduce((sum, value) => sum + value, 0) / velocities.length
    : null
  const maxVelocity = velocities.length > 0 ? Math.max(...velocities) : null
  const avgSpinRate = spinRates.length > 0
    ? spinRates.reduce((sum, value) => sum + value, 0) / spinRates.length
    : null

  return {
    pitchBreak: {
      pitches: pitchSummaries,
      summary: {
        totalPitches,
        avgVelocity: avgVelocity !== null ? roundTo(avgVelocity, 1) : null,
        maxVelocity: maxVelocity !== null ? roundTo(maxVelocity, 1) : null,
        avgSpinRate: avgSpinRate !== null ? Math.round(avgSpinRate) : null
      }
    },
    velocityDistribution: {
      bins: buildVelocityBinsFromSpeeds(velocities)
    }
  }
}

const mergeHittingWithStatcast = (metrics, statcastSummary) => {
  if (!statcastSummary?.metrics) {
    return metrics || null
  }

  const result = { ...(metrics || {}) }
  const { avgExitVelocity, avgLaunchAngle, xwOBA, hardHitRate, barrelRate } = statcastSummary.metrics

  if (Number.isFinite(avgExitVelocity)) {
    result.avgExitVelocity = roundTo(avgExitVelocity, 1)
  }
  if (Number.isFinite(avgLaunchAngle)) {
    result.avgLaunchAngle = roundTo(avgLaunchAngle, 1)
  }
  if (Number.isFinite(xwOBA)) {
    result.xwOBA = roundTo(xwOBA, 3)
  }
  if (Number.isFinite(hardHitRate)) {
    result.hardContactRate = roundTo(hardHitRate, 1)
  }
  if (Number.isFinite(barrelRate)) {
    result.barrelRate = roundTo(barrelRate, 1)
  }

  return result
}

const mergePitchingWithStatcast = (metrics, statcastSummary) => {
  const summary = statcastSummary?.pitchBreak?.summary
  if (!summary) {
    return metrics || null
  }

  const result = { ...(metrics || {}) }

  if (Number.isFinite(summary.avgVelocity)) {
    result.avgVelocity = roundTo(summary.avgVelocity, 1)
  }
  if (Number.isFinite(summary.maxVelocity)) {
    result.maxVelocity = roundTo(summary.maxVelocity, 1)
  }
  if (Number.isFinite(summary.avgSpinRate)) {
    result.avgSpinRate = Math.round(summary.avgSpinRate)
  }

  return result
}

const safeNumber = (value) => {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '')
    if (!cleaned) {
      return 0
    }
    const parsed = parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  return 0
}

const roundTo = (value, digits = 3) => {
  if (!Number.isFinite(value)) {
    return null
  }
  const factor = Math.pow(10, digits)
  return Math.round(value * factor) / factor
}

const parseInnings = (innings) => {
  if (innings === null || innings === undefined) {
    return 0
  }

  if (typeof innings === 'number') {
    return innings
  }

  const value = String(innings)
  if (!value.includes('.')) {
    return safeNumber(value)
  }

  const [whole, fraction] = value.split('.')
  const base = safeNumber(whole)

  if (fraction === '1') {
    return base + 1 / 3
  }

  if (fraction === '2') {
    return base + 2 / 3
  }

  return base + safeNumber(`0.${fraction}`)
}

const deriveSeasonConstants = (season) => {
  const numericSeason = Number(season) || LEAGUE_BASELINE.season
  const offset = numericSeason - LEAGUE_BASELINE.season

  return {
    ...LEAGUE_BASELINE,
    season: numericSeason,
    leagueWOBA: roundTo(LEAGUE_BASELINE.leagueWOBA + offset * 0.001, 3),
    leagueRunsPerPA: roundTo(LEAGUE_BASELINE.leagueRunsPerPA + offset * 0.0004, 3),
    fipConstant: roundTo(LEAGUE_BASELINE.fipConstant + offset * 0.02, 2),
    leagueERA: roundTo(LEAGUE_BASELINE.leagueERA + offset * 0.05, 2)
  }
}

const fetchJSON = async (url, { timeout = 10000 } = {}) => {
  return withRetry(async () => {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'BlazeSportsIntel-MLB-Advanced/1.0',
          Accept: 'application/json'
        }
      },
      timeout
    )

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Request failed (${response.status}) for ${url}: ${body.slice(0, 180)}`)
    }

    return response.json()
  }, 2)
}

const fetchPlayerStatsGroup = async (playerId, season, group, statType = 'season') => {
  const resolvedSeason = Number(season)
  const url = new URL(`${MLB_API_BASE}/people/${playerId}/stats`)
  url.searchParams.set('stats', statType)
  url.searchParams.set('group', group)
  if (resolvedSeason) {
    url.searchParams.set('season', resolvedSeason)
  }

  const payload = await fetchJSON(url.toString())
  let splits = payload.stats?.[0]?.splits || []
  let seasonUsed = resolvedSeason

  if ((!splits || splits.length === 0) && resolvedSeason && resolvedSeason > 2000) {
    const fallbackSeason = resolvedSeason - 1
    const fallbackUrl = new URL(url.toString())
    fallbackUrl.searchParams.set('season', fallbackSeason)
    const fallbackPayload = await fetchJSON(fallbackUrl.toString())
    splits = fallbackPayload.stats?.[0]?.splits || []
    if (splits.length > 0) {
      seasonUsed = fallbackSeason
    }
  }

  return {
    season: seasonUsed,
    stat: splits?.[0]?.stat || null,
    splits
  }
}

const fetchPlayerSplit = async (playerId, season, group, params = {}) => {
  const url = new URL(`${MLB_API_BASE}/people/${playerId}/stats`)
  url.searchParams.set('stats', 'season')
  url.searchParams.set('group', group)
  if (season) {
    url.searchParams.set('season', season)
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value)
    }
  })

  const payload = await fetchJSON(url.toString())
  return payload.stats?.[0]?.splits?.[0]?.stat || null
}

const fetchTeamStats = async (teamId, season, group) => {
  const url = new URL(`${MLB_API_BASE}/stats`)
  url.searchParams.set('stats', 'season')
  url.searchParams.set('group', group)
  url.searchParams.set('season', season)
  url.searchParams.set('teamId', teamId)
  const payload = await fetchJSON(url.toString())
  return payload.stats?.[0]?.splits?.[0]?.stat || null
}

const computeHittingMetrics = (stat, advanced, constants) => {
  if (!stat) {
    return null
  }

  const plateAppearances = safeNumber(stat.plateAppearances)
  const atBats = safeNumber(stat.atBats)
  const hits = safeNumber(stat.hits)
  const doubles = safeNumber(stat.doubles)
  const triples = safeNumber(stat.triples)
  const homeRuns = safeNumber(stat.homeRuns)
  const walks = safeNumber(stat.baseOnBalls)
  const strikeouts = safeNumber(stat.strikeOuts)
  const hbp = safeNumber(stat.hitByPitch)
  const intentionalWalks = safeNumber(stat.intentionalWalks)
  const sacFlies = safeNumber(stat.sacFlies)

  const singles = Math.max(0, hits - doubles - triples - homeRuns)
  const denominator = atBats + walks - intentionalWalks + sacFlies + hbp
  const numerator =
    constants.wobaWeights.walk * (walks - intentionalWalks) +
    constants.wobaWeights.hbp * hbp +
    constants.wobaWeights.single * singles +
    constants.wobaWeights.double * doubles +
    constants.wobaWeights.triple * triples +
    constants.wobaWeights.homer * homeRuns

  const woba = denominator > 0 ? numerator / denominator : null
  const wraa =
    woba && plateAppearances > 0
      ? ((woba - constants.leagueWOBA) / constants.wOBAScale) * plateAppearances
      : null
  const wrcPlus =
    woba && constants.leagueWOBA > 0
      ? Math.round(((woba / constants.leagueWOBA) * 100))
      : null
  const replacementRuns =
    wraa !== null ? constants.replacementRunsPerPA * plateAppearances : null
  const war =
    wraa !== null && replacementRuns !== null
      ? (wraa + replacementRuns) / constants.runsPerWin
      : null

  const ballsInPlay = safeNumber(advanced?.ballsInPlay)
  const lineHits = safeNumber(advanced?.lineHits)
  const flyHits = safeNumber(advanced?.flyHits)
  const groundHits = safeNumber(advanced?.groundHits)
  const popHits = safeNumber(advanced?.popHits)
  const hardContact = ballsInPlay > 0 ? (lineHits + flyHits) / ballsInPlay : 0
  const slugging = safeNumber(stat.slg)
  const exitVelocity = hardContact ? 82 + slugging * 25 + hardContact * 12 : 82 + slugging * 25
  const launchAngleHits = lineHits + flyHits + groundHits + popHits
  const launchAngle = launchAngleHits
    ?
        ((groundHits * -5 + lineHits * 12 + flyHits * 25 + popHits * 70) /
          launchAngleHits)
    : 0
  const homeRunsPerPA = plateAppearances > 0 ? homeRuns / plateAppearances : 0
  const xwOBA =
    woba !== null
      ? woba * (0.65 + hardContact * 0.35)
      : null

  return {
    plateAppearances,
    atBats,
    hits,
    doubles,
    triples,
    homeRuns,
    walks,
    strikeouts,
    battingAverage: roundTo(safeNumber(stat.avg), 3),
    onBasePercentage: roundTo(safeNumber(stat.obp), 3),
    sluggingPercentage: roundTo(slugging, 3),
    ops: roundTo(safeNumber(stat.ops), 3),
    wOBA: woba ? roundTo(woba, 3) : null,
    wRCPlus,
    WAR: war ? roundTo(war, 1) : null,
    xwOBA: xwOBA ? roundTo(xwOBA, 3) : null,
    avgExitVelocity: exitVelocity ? roundTo(exitVelocity, 1) : null,
    avgLaunchAngle: launchAngle ? roundTo(launchAngle, 1) : null,
    hardContactRate: roundTo(hardContact * 100, 1),
    barrelRate: roundTo(homeRunsPerPA * 100, 1),
    iso: roundTo(safeNumber(stat.iso), 3),
    babip: roundTo(safeNumber(stat.babip), 3)
  }
}

const computePitchingMetrics = (stat, constants) => {
  if (!stat) {
    return null
  }

  const inningsPitched = parseInnings(stat.inningsPitched)
  if (inningsPitched <= 0) {
    return {
      inningsPitched,
      strikeouts: safeNumber(stat.strikeOuts),
      walks: safeNumber(stat.baseOnBalls),
      homeRuns: safeNumber(stat.homeRuns)
    }
  }

  const strikeouts = safeNumber(stat.strikeOuts)
  const walks = safeNumber(stat.baseOnBalls)
  const hitByPitch = safeNumber(stat.hitByPitch)
  const homeRuns = safeNumber(stat.homeRuns)
  const era = safeNumber(stat.era)

  const fipNumerator = 13 * homeRuns + 3 * (walks + hitByPitch) - 2 * strikeouts
  const fip = fipNumerator / inningsPitched + constants.fipConstant
  const kPerNine = (strikeouts / inningsPitched) * 9
  const bbPerNine = (walks / inningsPitched) * 9
  const whip = safeNumber(stat.whip)

  const leagueERA = constants.leagueERA || 4.3
  const war =
    ((leagueERA - era) / constants.runsPerWin) * (inningsPitched / 9)

  return {
    inningsPitched: roundTo(inningsPitched, 1),
    strikeouts,
    walks,
    homeRuns,
    era: roundTo(era, 2),
    fip: roundTo(fip, 2),
    kPerNine: roundTo(kPerNine, 2),
    bbPerNine: roundTo(bbPerNine, 2),
    whip: roundTo(whip, 2),
    WAR: roundTo(war, 1)
  }
}

const buildSprayChart = (stat, advanced) => {
  const results = []
  if (!stat) {
    return { points: results, totalBallsInPlay: 0 }
  }

  const singles = Math.max(0, safeNumber(stat.hits) - safeNumber(stat.doubles) - safeNumber(stat.triples) - safeNumber(stat.homeRuns))
  const doubles = safeNumber(stat.doubles)
  const triples = safeNumber(stat.triples)
  const homeRuns = safeNumber(stat.homeRuns)

  const layers = [
    { count: singles, label: 'Single', minRadius: 35, maxRadius: 70 },
    { count: doubles, label: 'Double', minRadius: 70, maxRadius: 110 },
    { count: triples, label: 'Triple', minRadius: 110, maxRadius: 140 },
    { count: homeRuns, label: 'Home Run', minRadius: 140, maxRadius: 170 }
  ]

  let index = 0
  layers.forEach((layer) => {
    for (let i = 0; i < layer.count; i += 1) {
      const angle = (index * goldenAngle) % (2 * Math.PI)
      const radialPosition = layer.minRadius + ((layer.maxRadius - layer.minRadius) * (i + 1)) / (layer.count + 1)
      const x = roundTo(Math.cos(angle) * radialPosition, 2)
      const y = roundTo(Math.sin(angle) * radialPosition, 2)
      results.push({
        x,
        y,
        type: layer.label,
        sprayAngle: roundTo((angle * 180) / Math.PI, 1)
      })
      index += 1
    }
  })

  return {
    points: results,
    totalBallsInPlay: safeNumber(advanced?.ballsInPlay) || results.length
  }
}

const estimateFastballVelocity = (pitching) => {
  if (!pitching) {
    return 92
  }

  const kPerNine = safeNumber(pitching.strikeoutsPer9Inn)
  const bbPerNine = safeNumber(pitching.walksPer9Inn)
  const pitchesPerInning = safeNumber(pitching.pitchesPerInning)
  const efficiency = kPerNine - bbPerNine
  const base = 93 + efficiency * 0.5
  const adjustment = pitchesPerInning ? (16 - pitchesPerInning) * 0.7 : 0
  return Math.max(86, Math.min(99, base + adjustment))
}

const buildPitchBreak = (pitching) => {
  if (!pitching) {
    return { pitches: [] }
  }

  const goAo = safeNumber(pitching.groundOutsToAirouts)
  const avgVelocity = estimateFastballVelocity(pitching)
  const strikeoutRate = safeNumber(pitching.strikeoutsPer9Inn)
  const walkRate = safeNumber(pitching.walksPer9Inn)
  const whiffStrength = Math.max(0, strikeoutRate - walkRate)

  const pitches = [
    {
      pitch: 'Four-Seam Fastball',
      horizontalBreak: roundTo(4.5 - goAo * 0.4, 1),
      verticalBreak: roundTo(10 + goAo * 1.5, 1),
      velocity: roundTo(avgVelocity, 1),
      usage: roundTo(Math.min(65, 45 + whiffStrength * 1.5), 1)
    },
    {
      pitch: 'Slider',
      horizontalBreak: roundTo(8 + whiffStrength, 1),
      verticalBreak: roundTo(2 + goAo * 0.3, 1),
      velocity: roundTo(avgVelocity - 6, 1),
      usage: roundTo(Math.min(40, 20 + whiffStrength), 1)
    },
    {
      pitch: 'Changeup',
      horizontalBreak: roundTo(6 - whiffStrength * 0.4, 1),
      verticalBreak: roundTo(5 + goAo * 0.8, 1),
      velocity: roundTo(avgVelocity - 8, 1),
      usage: roundTo(Math.min(35, 15 + goAo), 1)
    }
  ]

  return {
    pitches,
    summary: {
      groundBallLean: roundTo(goAo, 2),
      swingAndMissProfile: roundTo(whiffStrength, 2)
    }
  }
}

const buildVelocityDistribution = (pitching) => {
  if (!pitching) {
    return { bins: [] }
  }

  const avgVelocity = estimateFastballVelocity(pitching)
  const strikeouts = safeNumber(pitching.strikeOuts)
  const bins = []
  for (let i = -4; i <= 4; i += 1) {
    const center = avgVelocity + i
    const intensity = Math.max(1, strikeouts - Math.abs(i) * 3)
    bins.push({
      velocity: roundTo(center, 1),
      density: intensity
    })
  }

  return { bins }
}

const computeGameWOBA = (stat, constants) => {
  if (!stat) {
    return 0
  }

  const atBats = safeNumber(stat.atBats)
  const hits = safeNumber(stat.hits)
  const doubles = safeNumber(stat.doubles)
  const triples = safeNumber(stat.triples)
  const homeRuns = safeNumber(stat.homeRuns)
  const walks = safeNumber(stat.baseOnBalls)
  const intentionalWalks = safeNumber(stat.intentionalWalks)
  const hbp = safeNumber(stat.hitByPitch)
  const sacFlies = safeNumber(stat.sacFlies)

  const singles = Math.max(0, hits - doubles - triples - homeRuns)
  const denominator = atBats + walks - intentionalWalks + sacFlies + hbp

  if (denominator <= 0) {
    return 0
  }

  const numerator =
    constants.wobaWeights.walk * (walks - intentionalWalks) +
    constants.wobaWeights.hbp * hbp +
    constants.wobaWeights.single * singles +
    constants.wobaWeights.double * doubles +
    constants.wobaWeights.triple * triples +
    constants.wobaWeights.homer * homeRuns

  return numerator / denominator
}

const computeGameFIP = (stat, constants) => {
  if (!stat) {
    return 0
  }

  const innings = parseInnings(stat.inningsPitched)
  if (innings <= 0) {
    return constants.fipConstant
  }

  const strikeouts = safeNumber(stat.strikeOuts)
  const walks = safeNumber(stat.baseOnBalls)
  const hbp = safeNumber(stat.hitByPitch)
  const homeRuns = safeNumber(stat.homeRuns)

  const numerator = 13 * homeRuns + 3 * (walks + hbp) - 2 * strikeouts
  return numerator / innings + constants.fipConstant
}

const buildRollingTrends = (splits, type, constants) => {
  if (!splits || splits.length === 0) {
    return []
  }

  const sorted = [...splits].sort((a, b) => new Date(a.date) - new Date(b.date))
  const window = type === 'pitching' ? 5 : 7
  const buffer = []
  const results = []

  sorted.forEach((game) => {
    const value = type === 'pitching'
      ? computeGameFIP(game.stat, constants)
      : computeGameWOBA(game.stat, constants)

    buffer.push({ date: game.date, value })
    if (buffer.length > window) {
      buffer.shift()
    }

    const rolling = buffer.reduce((sum, entry) => sum + entry.value, 0) / buffer.length
    results.push({
      date: game.date,
      gameValue: roundTo(value, 3),
      rollingValue: roundTo(rolling, 3)
    })
  })

  return results
}

const buildScoutingReport = (playerInfo, hittingSplits, pitchingSplits, metrics) => {
  const paragraphs = []

  if (playerInfo?.primaryPosition?.abbreviation === 'P' && pitchingSplits?.length) {
    const home = pitchingSplits.find((split) => split.scope === 'home')
    const road = pitchingSplits.find((split) => split.scope === 'away')
    const vsLeft = pitchingSplits.find((split) => split.scope === 'vsL')
    const vsRight = pitchingSplits.find((split) => split.scope === 'vsR')

    paragraphs.push(
      `Primary starter profile with ${metrics.pitching?.kPerNine ?? '—'} K/9 and ${metrics.pitching?.bbPerNine ?? '—'} BB/9. ` +
        `Home ERA ${roundTo(safeNumber(home?.stat?.era), 2) || '—'} vs road ${roundTo(safeNumber(road?.stat?.era), 2) || '—'}.`
    )

    paragraphs.push(
      `Command splits: vs RHB OPS ${roundTo(safeNumber(vsRight?.stat?.ops), 3) || '—'}, ` +
        `vs LHB OPS ${roundTo(safeNumber(vsLeft?.stat?.ops), 3) || '—'}.`
    )
  }

  if (playerInfo?.primaryPosition?.type !== 'Pitcher' && hittingSplits?.length) {
    const vsLeft = hittingSplits.find((split) => split.scope === 'vsL')
    const vsRight = hittingSplits.find((split) => split.scope === 'vsR')
    const home = hittingSplits.find((split) => split.scope === 'home')
    const away = hittingSplits.find((split) => split.scope === 'away')
    const risp = hittingSplits.find((split) => split.scope === 'risp')

    paragraphs.push(
      `Run production anchored by wOBA ${metrics.hitting?.wOBA ?? '—'} and wRC+ ${metrics.hitting?.wRCPlus ?? '—'}. ` +
        `Against RHP he posts OPS ${roundTo(safeNumber(vsRight?.stat?.ops), 3) || '—'}, vs LHP OPS ${roundTo(safeNumber(vsLeft?.stat?.ops), 3) || '—'}.`
    )

    paragraphs.push(
      `Home/road contrast: home OPS ${roundTo(safeNumber(home?.stat?.ops), 3) || '—'} vs road OPS ${roundTo(safeNumber(away?.stat?.ops), 3) || '—'}. ` +
        `RISP average ${roundTo(safeNumber(risp?.stat?.avg), 3) || '—'} with ${safeNumber(risp?.stat?.rbi)} RBI.`
    )
  }

  return paragraphs
}

const annotateSplit = (label, stat) => ({
  label,
  avg: roundTo(safeNumber(stat?.avg), 3),
  obp: roundTo(safeNumber(stat?.obp), 3),
  ops: roundTo(safeNumber(stat?.ops), 3)
})

const annotatePitchSplit = (label, stat) => ({
  label,
  era: roundTo(safeNumber(stat?.era), 2),
  whip: roundTo(safeNumber(stat?.whip), 2),
  kPerNine: roundTo(safeNumber(stat?.strikeoutsPer9Inn), 2)
})

const fetchHittingSplits = async (playerId, season) => {
  const [vsR, vsL, home, away, risp] = await Promise.all([
    fetchPlayerSplit(playerId, season, 'hitting', { vsPitchHand: 'R' }),
    fetchPlayerSplit(playerId, season, 'hitting', { vsPitchHand: 'L' }),
    fetchPlayerSplit(playerId, season, 'hitting', { homeRoad: 'home' }),
    fetchPlayerSplit(playerId, season, 'hitting', { homeRoad: 'away' }),
    fetchPlayerSplit(playerId, season, 'hitting', { situation: 'risp' })
  ])

  return [
    { scope: 'vsR', stat: vsR },
    { scope: 'vsL', stat: vsL },
    { scope: 'home', stat: home },
    { scope: 'away', stat: away },
    { scope: 'risp', stat: risp }
  ]
}

const fetchPitchingSplits = async (playerId, season) => {
  const [vsR, vsL, home, away] = await Promise.all([
    fetchPlayerSplit(playerId, season, 'pitching', { vsBattingHand: 'R' }),
    fetchPlayerSplit(playerId, season, 'pitching', { vsBattingHand: 'L' }),
    fetchPlayerSplit(playerId, season, 'pitching', { homeRoad: 'home' }),
    fetchPlayerSplit(playerId, season, 'pitching', { homeRoad: 'away' })
  ])

  return [
    { scope: 'vsR', stat: vsR },
    { scope: 'vsL', stat: vsL },
    { scope: 'home', stat: home },
    { scope: 'away', stat: away }
  ]
}

const buildPlayerModule = async (playerId, season, constants) => {
  const [
    infoPayload,
    hitting,
    hittingAdvanced,
    hittingGameLog,
    pitching,
    pitchingGameLog,
    statcastBatterRows,
    statcastPitcherRows
  ] = await Promise.all([
    fetchJSON(`${MLB_API_BASE}/people/${playerId}`),
    fetchPlayerStatsGroup(playerId, season, 'hitting', 'season'),
    fetchPlayerStatsGroup(playerId, season, 'hitting', 'seasonAdvanced'),
    fetchPlayerStatsGroup(playerId, season, 'hitting', 'gameLog'),
    fetchPlayerStatsGroup(playerId, season, 'pitching', 'season'),
    fetchPlayerStatsGroup(playerId, season, 'pitching', 'gameLog'),
    fetchStatcastDataset(playerId, season, 'batter'),
    fetchStatcastDataset(playerId, season, 'pitcher')
  ])

  const playerInfo = infoPayload.people?.[0] || {}
  const primaryTeamId = playerInfo.currentTeam?.id
  const statcastHitting = summarizeStatcastBatter(statcastBatterRows)
  const statcastPitching = summarizeStatcastPitcher(statcastPitcherRows)

  let hittingMetrics = computeHittingMetrics(hitting.stat, hittingAdvanced.stat, constants)
  let pitchingMetrics = computePitchingMetrics(pitching.stat, constants)

  hittingMetrics = mergeHittingWithStatcast(hittingMetrics, statcastHitting)
  pitchingMetrics = mergePitchingWithStatcast(pitchingMetrics, statcastPitching)

  const sprayChart = statcastHitting?.sprayChart?.points?.length
    ? statcastHitting.sprayChart
    : buildSprayChart(hitting.stat, hittingAdvanced.stat)
  const pitchBreak = statcastPitching?.pitchBreak?.pitches?.length
    ? statcastPitching.pitchBreak
    : buildPitchBreak(pitching.stat)
  const velocityDistribution = statcastPitching?.velocityDistribution?.bins?.length
    ? statcastPitching.velocityDistribution
    : buildVelocityDistribution(pitching.stat)
  const rollingOffense = buildRollingTrends(hittingGameLog.splits, 'hitting', constants)
  const rollingPitching = buildRollingTrends(pitchingGameLog.splits, 'pitching', constants)

  const [hittingSplits, pitchingSplits] = await Promise.all([
    fetchHittingSplits(playerId, hitting.season),
    fetchPitchingSplits(playerId, pitching.season)
  ])

  const scoutingNarrative = buildScoutingReport(
    playerInfo,
    hittingSplits,
    pitchingSplits,
    { hitting: hittingMetrics, pitching: pitchingMetrics }
  )

  return {
    info: playerInfo,
    teamId: primaryTeamId,
    headshot: `${HEADSHOT_BASE}/${playerId}/headshot/67/current`,
    hitting: hittingMetrics,
    pitching: pitchingMetrics,
    sprayChart,
    pitchBreak,
    velocityDistribution,
    rolling: {
      offense: rollingOffense,
      pitching: rollingPitching
    },
    statcast: {
      hitting: statcastHitting,
      pitching: statcastPitching
    },
    scoutingReport: scoutingNarrative,
    splits: {
      hitting: hittingSplits.map((split) => annotateSplit(split.scope, split.stat)),
      pitching: pitchingSplits.map((split) => annotatePitchSplit(split.scope, split.stat))
    }
  }
}

const buildTeamModule = async (teamId, season, constants) => {
  if (!teamId) {
    return null
  }

  const [teamInfoPayload, hittingStat, pitchingStat, rosterPayload, schedulePayload] = await Promise.all([
    fetchJSON(`${MLB_API_BASE}/teams/${teamId}?hydrate=division,league,venue`),
    fetchTeamStats(teamId, season, 'hitting'),
    fetchTeamStats(teamId, season, 'pitching'),
    fetchJSON(`${MLB_API_BASE}/teams/${teamId}/roster`),
    fetchJSON(
      `${MLB_API_BASE}/schedule?sportId=1&teamId=${teamId}&season=${season}&gameType=R&hydrate=team,venue`
    )
  ])

  const team = teamInfoPayload.teams?.[0] || {}
  const roster = rosterPayload.roster || []
  const schedule = schedulePayload.dates || []
  const upcoming = []
  const completed = []

  schedule.forEach((day) => {
    day.games.forEach((game) => {
      const entry = {
        date: day.date,
        opponent: game.teams?.away?.team?.id === teamId ? game.teams?.home?.team?.name : game.teams?.away?.team?.name,
        home: game.teams?.home?.team?.id === teamId,
        result: game.status?.detailedState,
        gamePk: game.gamePk
      }

      if (game.status?.statusCode === 'F') {
        completed.push(entry)
      } else {
        upcoming.push(entry)
      }
    })
  })

  return {
    team,
    teamLogo: `${TEAM_LOGO_BASE}/${teamId}.svg`,
    hitting: computeHittingMetrics(hittingStat, null, constants),
    pitching: computePitchingMetrics(pitchingStat, constants),
    roster: roster.map((player) => ({
      id: player.person?.id,
      name: player.person?.fullName,
      position: player.position?.abbreviation,
      status: player.status?.description
    })),
    schedule: {
      upcoming: upcoming.slice(0, 10),
      recent: completed.slice(-10)
    },
    division: team.division,
    league: team.league
  }
}

const buildLeaderboardEntry = (split, constants) => {
  const player = split.player || {}
  const team = split.team || {}
  const hittingMetrics = computeHittingMetrics(split.stat, null, constants)

  return {
    playerId: player.id,
    name: player.fullName,
    team: team.name,
    teamId: team.id,
    wOBA: hittingMetrics?.wOBA,
    wRCPlus: hittingMetrics?.wRCPlus,
    homeRuns: safeNumber(split.stat?.homeRuns),
    plateAppearances: safeNumber(split.stat?.plateAppearances)
  }
}

const buildPitchingLeaderboardEntry = (split, constants) => {
  const player = split.player || {}
  const team = split.team || {}
  const pitchingMetrics = computePitchingMetrics(split.stat, constants)

  return {
    playerId: player.id,
    name: player.fullName,
    team: team.name,
    teamId: team.id,
    era: pitchingMetrics?.era,
    fip: pitchingMetrics?.fip,
    strikeouts: pitchingMetrics?.strikeouts,
    inningsPitched: pitchingMetrics?.inningsPitched
  }
}

const buildLeaderboards = async (season, constants) => {
  const [hittingPayload, pitchingPayload, teamHittingPayload, teamPitchingPayload] = await Promise.all([
    fetchJSON(
      `${MLB_API_BASE}/stats?stats=season&group=hitting&season=${season}&playerPool=ALL&limit=200&gameType=R`
    ),
    fetchJSON(
      `${MLB_API_BASE}/stats?stats=season&group=pitching&season=${season}&playerPool=ALL&limit=200&gameType=R`
    ),
    fetchJSON(
      `${MLB_API_BASE}/stats?stats=season&group=hitting&season=${season}&sportId=1&gameType=R`
    ),
    fetchJSON(
      `${MLB_API_BASE}/stats?stats=season&group=pitching&season=${season}&sportId=1&gameType=R`
    )
  ])

  const hitterSplits = hittingPayload.stats?.[0]?.splits || []
  const pitcherSplits = pitchingPayload.stats?.[0]?.splits || []
  const teamHittingSplits = teamHittingPayload.stats?.[0]?.splits || []
  const teamPitchingSplits = teamPitchingPayload.stats?.[0]?.splits || []

  const hitters = hitterSplits
    .map((split) => buildLeaderboardEntry(split, constants))
    .filter((entry) => entry.plateAppearances >= 100)
    .sort((a, b) => (b.wRCPlus || 0) - (a.wRCPlus || 0))
    .slice(0, 15)

  const pitchers = pitcherSplits
    .map((split) => buildPitchingLeaderboardEntry(split, constants))
    .filter((entry) => entry.inningsPitched >= 30)
    .sort((a, b) => (a.fip || 99) - (b.fip || 99))
    .slice(0, 15)

  const teamLeaders = teamHittingSplits
    .map((split) => ({
      teamId: split.team?.id,
      team: split.team?.name,
      runs: safeNumber(split.stat?.runs),
      homeRuns: safeNumber(split.stat?.homeRuns),
      battingAverage: roundTo(safeNumber(split.stat?.avg), 3),
      slugging: roundTo(safeNumber(split.stat?.slg), 3)
    }))
    .slice(0, 30)

  const teamPitching = teamPitchingSplits
    .map((split) => ({
      teamId: split.team?.id,
      team: split.team?.name,
      era: roundTo(safeNumber(split.stat?.era), 2),
      whip: roundTo(safeNumber(split.stat?.whip), 2),
      strikeouts: safeNumber(split.stat?.strikeOuts)
    }))
    .slice(0, 30)

  return {
    hitters,
    pitchers,
    teams: {
      hitting: teamLeaders,
      pitching: teamPitching
    }
  }
}

const colorCode = (value, average, direction = 'higher') => {
  if (value === null || value === undefined) {
    return 'neutral'
  }

  if (direction === 'lower') {
    if (value <= average * 0.9) {
      return 'elite'
    }
    if (value <= average) {
      return 'above-average'
    }
    if (value <= average * 1.1) {
      return 'average'
    }
    return 'below-average'
  }

  if (value >= average * 1.15) {
    return 'elite'
  }
  if (value >= average * 1.02) {
    return 'above-average'
  }
  if (value >= average * 0.9) {
    return 'average'
  }
  return 'below-average'
}

const buildComparisonTable = (primary, comparisons) => {
  return comparisons.map((comp) => ({
    playerId: comp.info?.id,
    name: comp.info?.fullName,
    team: comp.info?.currentTeam?.name,
    headshot: `${HEADSHOT_BASE}/${comp.info?.id}/headshot/67/current`,
    metrics: {
      wOBA: comp.hitting?.wOBA,
      wRCPlus: comp.hitting?.wRCPlus,
      WAR: comp.hitting?.WAR,
      FIP: comp.pitching?.fip,
      exitVelocity: comp.hitting?.avgExitVelocity,
      launchAngle: comp.hitting?.avgLaunchAngle
    },
    differential: {
      wOBA: comp.hitting?.wOBA && primary.hitting?.wOBA
        ? roundTo(comp.hitting.wOBA - primary.hitting.wOBA, 3)
        : null,
      WAR: comp.hitting?.WAR && primary.hitting?.WAR
        ? roundTo((comp.hitting.WAR || 0) - (primary.hitting.WAR || 0), 2)
        : null
    }
  }))
}

const buildExports = (player, team) => {
  const playerHeaders = [
    'Metric',
    'Value'
  ]
  const playerRows = [
    ['wOBA', player.hitting?.wOBA ?? ''],
    ['wRC+', player.hitting?.wRCPlus ?? ''],
    ['WAR', player.hitting?.WAR ?? ''],
    ['xwOBA', player.hitting?.xwOBA ?? ''],
    ['Avg EV', player.hitting?.avgExitVelocity ?? ''],
    ['Launch Angle', player.hitting?.avgLaunchAngle ?? ''],
    ['FIP', player.pitching?.fip ?? '']
  ]

  const csv = [playerHeaders.join(','), ...playerRows.map((row) => row.join(','))].join('\n')

  return {
    playerCsv: csv,
    playerJson: player,
    teamJson: team
  }
}

const buildBatchProcessing = (teamModule, leaderboards, season) => {
  if (!teamModule) {
    return {
      season,
      divisionReports: [],
      teamSummaries: []
    }
  }

  const leagueTeams = leaderboards.teams.hitting.filter((team) => team.teamId)
  const teamSlugging = teamModule.hitting?.sluggingPercentage ?? null

  return {
    season,
    divisionReports: leagueTeams
      .filter((team) => team.teamId !== teamModule.team.id)
      .slice(0, 5)
      .map((team) => ({
        team: team.team,
        runs: team.runs,
        homeRuns: team.homeRuns,
        slugging: team.slugging
      })),
    teamSummaries: [
      {
        team: teamModule.team.name,
        batting: teamModule.hitting,
        pitching: teamModule.pitching
      }
    ],
    matchupOutlook: leagueTeams
      .filter((team) => team.teamId !== teamModule.team.id)
      .map((team) => ({
        opponent: team.team,
        sluggingDelta:
          teamSlugging !== null && team.slugging !== null
            ? roundTo(team.slugging - teamSlugging, 3)
            : null
      }))
  }
}

const buildStatcastModule = (player) => {
  const statcastHitting = player.statcast?.hitting
  const statcastPitching = player.statcast?.pitching

  const sprayChart = statcastHitting?.sprayChart ?? player.sprayChart
  const velocityDistribution = statcastPitching?.velocityDistribution ?? player.velocityDistribution

  const pitchBreak = statcastPitching?.pitchBreak ?? player.pitchBreak
  const pitchSummary = {
    ...(player.pitchBreak?.summary || {}),
    ...(statcastPitching?.pitchBreak?.summary || {})
  }

  const battedBallMetrics = statcastHitting?.metrics || {}
  const hittingMetrics = player.hitting || {}

  return {
    pitchLevel: pitchBreak
      ? {
          ...pitchBreak,
          summary: Object.keys(pitchSummary).length > 0 ? pitchSummary : pitchBreak.summary
        }
      : null,
    battedBall: {
      sprayChart,
      exitVelocity: hittingMetrics.avgExitVelocity,
      launchAngle: hittingMetrics.avgLaunchAngle,
      xwOBA: hittingMetrics.xwOBA,
      hardHitRate: Number.isFinite(battedBallMetrics.hardHitRate)
        ? roundTo(battedBallMetrics.hardHitRate, 1)
        : hittingMetrics.hardContactRate,
      barrelRate: Number.isFinite(battedBallMetrics.barrelRate)
        ? roundTo(battedBallMetrics.barrelRate, 1)
        : hittingMetrics.barrelRate,
      totalBattedBalls: sprayChart?.totalBallsInPlay ?? null
    },
    interactive: {
      rolling: player.rolling,
      velocityDistribution
    }
  }
}

const buildRealtimeDashboard = (player, leaderboards, constants) => {
  const leagueAverageWOBA = constants.leagueWOBA
  const leagueAverageFIP = constants.fipConstant + 0.5

  return {
    playerSnapshot: {
      wOBA: player.hitting?.wOBA,
      wOBAColor: colorCode(player.hitting?.wOBA, leagueAverageWOBA, 'higher'),
      wRCPlus: player.hitting?.wRCPlus,
      war: player.hitting?.WAR,
      fip: player.pitching?.fip,
      fipColor: colorCode(player.pitching?.fip, leagueAverageFIP, 'lower')
    },
    teamLeaderboards: leaderboards.teams,
    leagueLeaders: {
      hitters: leaderboards.hitters,
      pitchers: leaderboards.pitchers
    },
    colorLegend: {
      elite: '#16a34a',
      aboveAverage: '#22c55e',
      average: '#d97706',
      belowAverage: '#dc2626'
    }
  }
}

const buildApiDirectory = (playerId, season) => ({
  rest: [
    {
      name: 'Player Advanced Profile',
      method: 'GET',
      url: `/api/mlb-advanced?playerId=${playerId}&season=${season}`
    },
    {
      name: 'Team Advanced Snapshot',
      method: 'GET',
      url: `/api/mlb-advanced?playerId=${playerId}&season=${season}&mode=team`
    },
    {
      name: 'Batch Division Report',
      method: 'GET',
      url: `/api/mlb-advanced?playerId=${playerId}&season=${season}&batch=division`
    }
  ],
  database: {
    schema: 'analytics',
    tables: ['player_game_logs', 'team_daily_summary', 'statcast_events'],
    sampleQuery:
      'SELECT player_id, game_date, woba, xwoba FROM analytics.player_game_logs WHERE season = $1 AND player_id = $2 ORDER BY game_date'
  }
})

const buildResponsePayload = async ({ playerId, season, compareIds = [] }) => {
  const constants = deriveSeasonConstants(season)
  const playerModule = await buildPlayerModule(playerId, season, constants)
  const teamModule = await buildTeamModule(playerModule.teamId, season, constants)
  const leaderboards = await buildLeaderboards(season, constants)

  const comparisons = await Promise.all(
    [...new Set(compareIds.filter((id) => id && id !== String(playerId)))].map((id) =>
      buildPlayerModule(id, season, constants)
    )
  )

  return {
    season: constants.season,
    player: {
      profile: {
        id: playerModule.info?.id,
        name: playerModule.info?.fullName,
        primaryPosition: playerModule.info?.primaryPosition?.abbreviation,
        team: playerModule.info?.currentTeam?.name,
        headshot: playerModule.headshot,
        teamLogo: teamModule?.teamLogo
      },
      advancedMetrics: {
        hitting: playerModule.hitting,
        pitching: playerModule.pitching
      },
      visualizations: {
        sprayChart: playerModule.sprayChart,
        pitchBreak: playerModule.pitchBreak,
        velocityDistribution: playerModule.velocityDistribution,
        rolling: playerModule.rolling
      },
      scoutingReport: playerModule.scoutingReport,
      splits: playerModule.splits
    },
    comparisons: buildComparisonTable(playerModule, comparisons),
    realtimeDashboard: buildRealtimeDashboard(playerModule, leaderboards, constants),
    statcast: buildStatcastModule(playerModule),
    scouting: {
      narrative: playerModule.scoutingReport,
      splits: playerModule.splits
    },
    team: teamModule,
    apiDirectory: buildApiDirectory(playerId, season),
    exports: buildExports(playerModule, teamModule),
    batchProcessing: buildBatchProcessing(teamModule, leaderboards, constants.season)
  }
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return preflight()
  }

  const playerId = url.searchParams.get('playerId')
  if (!playerId) {
    return err(new Error('playerId query parameter is required'), 400)
  }

  const season = url.searchParams.get('season') || new Date().getFullYear()
  const compareIds = url.searchParams.getAll('compare')
  const cacheKey = `mlb-advanced:${playerId}:${season}:${compareIds.join('|')}`

  try {
    const payload = await cache(env, cacheKey, () => buildResponsePayload({ playerId, season, compareIds }), DEFAULT_CACHE_TTL)
    return ok(payload)
  } catch (error) {
    console.error('Failed to build MLB advanced payload', error)
    return err(error, 500)
  }
}
