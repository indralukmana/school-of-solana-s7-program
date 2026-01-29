import { IRequest } from 'itty-router'

export async function handleGetAnalytics(
  request: IRequest,
  env: { DB: D1Database },
): Promise<Response> {
  const url = new URL(request.url)
  const owner = url.searchParams.get('owner')
  if (!owner) {
    return new Response(JSON.stringify({ error: 'owner query param required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Aggregate stats (single query joining outcomes to plans)
  const { results: aggResults } = await env.DB.prepare(
    `SELECT
       COALESCE(SUM(o.pnl_lamports), 0) AS total_pnl_lamports,
       COALESCE(SUM(CASE WHEN o.pnl_lamports > 0 THEN o.pnl_lamports ELSE 0 END), 0) AS total_positive,
       COALESCE(SUM(CASE WHEN o.pnl_lamports < 0 THEN ABS(o.pnl_lamports) ELSE 0 END), 0) AS total_negative,
       COALESCE(SUM(CASE WHEN o.pnl_lamports > 0 THEN 1 ELSE 0 END), 0) AS win_count,
       COUNT(o.id) AS total_outcomes
     FROM outcomes o
     JOIN plans p ON o.plan_id = p.id
     WHERE p.owner_id = ?`,
  )
    .bind(owner)
    .all()

  const agg = aggResults[0] as {
    total_pnl_lamports: number
    total_positive: number
    total_negative: number
    win_count: number
    total_outcomes: number
  }

  const totalPnlLamports = agg.total_pnl_lamports
  const totalOutcomes = agg.total_outcomes
  const winRate = totalOutcomes > 0 ? agg.win_count / totalOutcomes : 0
  const profitFactor =
    agg.total_negative > 0
      ? Math.round((agg.total_positive / agg.total_negative) * 100) / 100
      : agg.total_positive > 0
        ? null // infinity
        : 0

  // Monthly time series
  const { results: monthResults } = await env.DB.prepare(
    `SELECT
       strftime('%Y-%m', o.created_at) AS month,
       COALESCE(SUM(o.pnl_lamports), 0) AS pnl_lamports,
       COUNT(o.id) AS count
     FROM outcomes o
     JOIN plans p ON o.plan_id = p.id
     WHERE p.owner_id = ?
     GROUP BY month
     ORDER BY month ASC`,
  )
    .bind(owner)
    .all()

  // Ticker stats
  const { results: tickerResults } = await env.DB.prepare(
    `SELECT
       COALESCE(p.ticker, 'Unknown') AS ticker,
       COALESCE(SUM(o.pnl_lamports), 0) AS pnl_lamports,
       COUNT(o.id) AS count
     FROM outcomes o
     JOIN plans p ON o.plan_id = p.id
     WHERE p.owner_id = ?
     GROUP BY p.ticker
     ORDER BY ABS(SUM(o.pnl_lamports)) DESC`,
  )
    .bind(owner)
    .all()

  return new Response(
    JSON.stringify({
      totalPnlLamports,
      profitFactor,
      winRate,
      totalOutcomes,
      outcomeMonths: monthResults,
      tickerStats: tickerResults,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
