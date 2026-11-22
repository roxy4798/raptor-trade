/**
 * Raptor Trade v24 — Cloudflare Pages advanced-mode Worker.
 * Works with dashboard ZIP/direct uploads. Static assets remain served via ASSETS.
 * Public, read-only OHLCV proxy. Restricts market, symbol, interval and limit.
 */
const MARKETS = {
  'USD-M': 'https://fapi.binance.com/fapi/v1/klines',
  'COIN-M': 'https://dapi.binance.com/dapi/v1/klines',
};
function json(value, status=200, extra={}) {
  return new Response(JSON.stringify(value), {status, headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    ...extra,
  }});
}
async function serveKlines(request) {
  if (request.method !== 'GET') return json({error:'Method not allowed'},405,{Allow:'GET'});
  const p = new URL(request.url).searchParams;
  const market = String(p.get('market')||'USD-M').toUpperCase();
  const symbol = String(p.get('symbol')||'').toUpperCase();
  // Restrict to Binance futures symbol syntax. No dynamic origins or arbitrary URLs.
  const limit = Number(p.get('limit') || 600);
  if (!Object.hasOwn(MARKETS, market) || !/^[A-Z0-9_]{5,35}$/.test(symbol)
    || !Number.isInteger(limit) || limit < 30 || limit > 1000) {
    return json({error:'Invalid market, symbol, or limit.'},400);
  }
  const api = new URL(MARKETS[market]);
  api.searchParams.set('symbol',symbol);
  api.searchParams.set('interval','4h');
  api.searchParams.set('limit',String(limit));
  const ctl = new AbortController();
  const timeout = setTimeout(()=>ctl.abort(),8500);
  try {
    const resp = await fetch(api.toString(), {
      method:'GET',signal:ctl.signal, headers:{Accept:'application/json'},
      cf:{cacheEverything:true, cacheTtl:20},
    });
    const text = await resp.text();
    if (!resp.ok) return json({error:resp.status===400 || resp.status===404
       ? 'Binance does not provide candles for this futures contract.'
       : 'Binance upstream unavailable.',status:resp.status},resp.status===400||resp.status===404?404:502);
    if(text.length>2500000) return json({error:'Upstream data exceeded limit.'},502);
    let rows;
    try {rows=JSON.parse(text)}catch{return json({error:'Invalid Binance response.'},502)}
    if(!Array.isArray(rows) || !rows.every(row=>Array.isArray(row)&&row.length>=6))return json({error:'Unexpected Binance OHLCV payload.'},502);
    return json({source:'Binance Futures',symbol,market,interval:'4h',retrievedAt:Date.now(),klines:rows},200,{
      'Cache-Control':'public, max-age=12, s-maxage=20'
    });
  } catch(e) {
    return json({error:e?.name==='AbortError'?'Binance request timed out.':'Binance data connection failed.'},503);
  } finally {clearTimeout(timeout)}
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path==='/api/futures/klines') return serveKlines(request);
    return env.ASSETS.fetch(request);
  },
};
