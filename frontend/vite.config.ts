import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const ALLOWED_MAP_HOST_RE =
  /^(?:maps\.app\.goo\.gl|goo\.gl|g\.co|g\.page|(?:www\.|maps\.)?google\.[a-z.]{2,6}|(?:www\.)?openstreetmap\.org|osm\.org)$/i;

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -85 &&
    lat <= 85 &&
    lng >= -180 &&
    lng <= 180
  );
}

function dmsToDecimal(deg: string, min: string, sec: string, hemi: string): number {
  const val = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
  return hemi === 'S' || hemi === 'W' ? -val : val;
}

function extractCoordsAndNameFromUrl(rawUrl: string): {
  lat?: number;
  lng?: number;
  placeName?: string;
} {
  let decoded = rawUrl;
  try {
    decoded = decodeURIComponent(rawUrl);
  } catch {
    // keep rawUrl
  }

  let lat: number | undefined;
  let lng: number | undefined;

  // 1. Exact Google Maps place pin (!3dLAT!4dLNG): use the LAST occurrence if multiple
  const d34Matches = [...decoded.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
  if (d34Matches.length > 0) {
    const m = d34Matches[d34Matches.length - 1];
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (isValidLatLng(a, b)) {
      lat = a;
      lng = b;
    }
  }

  // 2. Embed iframe format (!2dLNG!3dLAT)
  if (lat === undefined) {
    const m = decoded.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
    if (m) {
      const a = Number(m[2]);
      const b = Number(m[1]);
      if (isValidLatLng(a, b)) {
        lat = a;
        lng = b;
      }
    }
  }

  // 3. DMS coordinates in URL (e.g. 36°28'09.8"N+10°46'51.6"E)
  if (lat === undefined) {
    const dms = decoded.match(
      /(\d{1,2})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)["″]?\s*([NS])[\s+,]+(\d{1,3})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)["″]?\s*([EW])/i
    );
    if (dms) {
      const a = dmsToDecimal(dms[1], dms[2], dms[3], dms[4].toUpperCase());
      const b = dmsToDecimal(dms[5], dms[6], dms[7], dms[8].toUpperCase());
      if (isValidLatLng(a, b)) {
        lat = a;
        lng = b;
      }
    }
  }

  // 4. Query parameter coordinates (?q=LAT,LNG, ll=LAT,LNG, query=LAT,LNG, destination=LAT,LNG)
  if (lat === undefined) {
    const qm = decoded.match(
      /[?&](?:q|ll|sll|query|destination|daddr|center)=(?:loc:)?(-?\d{1,2}(?:\.\d+)?)[,\s+]+(-?\d{1,3}(?:\.\d+)?)/i
    );
    if (qm) {
      const a = Number(qm[1]);
      const b = Number(qm[2]);
      if (isValidLatLng(a, b)) {
        lat = a;
        lng = b;
      }
    }
  }

  // 5. Path coordinates: /maps/search/LAT,+LNG, /maps/place/LAT,+LNG, /maps/dir/.../LAT,LNG
  if (lat === undefined) {
    const pm = decoded.match(
      /\/maps\/(?:search|place|dir\/[^/]*)\/(-?\d{1,2}\.\d+)[,\s+]+(-?\d{1,3}\.\d+)/i
    );
    if (pm) {
      const a = Number(pm[1]);
      const b = Number(pm[2]);
      if (isValidLatLng(a, b)) {
        lat = a;
        lng = b;
      }
    }
  }

  // 6. Viewport coordinates (@LAT,LNG)
  if (lat === undefined) {
    const at = decoded.match(/@(-?\d{1,2}(?:\.\d+)?)[,\s+]+(-?\d{1,3}(?:\.\d+)?)/);
    if (at) {
      const a = Number(at[1]);
      const b = Number(at[2]);
      if (isValidLatLng(a, b)) {
        lat = a;
        lng = b;
      }
    }
  }

  // Extract readable place name from /maps/place/<Name> or /maps/search/<Name> or ?q=<Name>
  let placeName: string | undefined;
  const placePath = rawUrl.match(/\/maps\/(?:place|search)\/([^/@?]+)/i);
  if (placePath?.[1]) {
    try {
      const cleaned = decodeURIComponent(placePath[1].replace(/\+/g, ' ')).trim();
      // Ignore pure coordinate strings or DMS strings as the "name"
      if (cleaned && !/^-?\d+[.,°]/.test(cleaned)) {
        placeName = cleaned;
      }
    } catch {
      // ignore
    }
  }
  if (!placeName) {
    try {
      const u = new URL(rawUrl);
      const q = u.searchParams.get('q') || u.searchParams.get('query');
      if (q && !/^(?:loc:)?-?\d+[.,°]/.test(q.trim())) {
        placeName = q.trim();
      }
    } catch {
      // ignore
    }
  }

  return {
    lat: lat !== undefined ? Number(lat.toFixed(6)) : undefined,
    lng: lng !== undefined ? Number(lng.toFixed(6)) : undefined,
    placeName,
  };
}

function mapLinkResolverPlugin(): Plugin {
  const attachMiddleware = (middlewares: Connect.Server) => {
    middlewares.use('/api/resolve-map-link', async (rawReq, rawRes) => {
      const req = rawReq as { url?: string };
      const res = rawRes as {
        statusCode: number;
        setHeader: (k: string, v: string) => void;
        end: (body: string) => void;
      };
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      try {
        const parsedReq = new URL(req.url || '', 'http://localhost');
        const target = parsedReq.searchParams.get('url')?.trim() || '';
        if (!target) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'Missing url parameter' }));
          return;
        }

        let currentUrl: URL;
        try {
          currentUrl = new URL(target);
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'Invalid URL' }));
          return;
        }

        if (
          (currentUrl.protocol !== 'https:' && currentUrl.protocol !== 'http:') ||
          !ALLOWED_MAP_HOST_RE.test(currentUrl.hostname)
        ) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'Unsupported map link host' }));
          return;
        }

        let bestLat: number | undefined;
        let bestLng: number | undefined;
        let bestName: string | undefined;
        let finalUrl = currentUrl.toString();

        const recordFromUrl = (u: string) => {
          const found = extractCoordsAndNameFromUrl(u);
          if (found.lat !== undefined && found.lng !== undefined) {
            bestLat = found.lat;
            bestLng = found.lng;
          }
          if (found.placeName && !bestName) {
            bestName = found.placeName;
          }
        };

        recordFromUrl(finalUrl);

        // Follow redirects hop-by-hop to capture Google Maps short link targets cleanly
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        try {
          let hopUrl = finalUrl;
          for (let hop = 0; hop < 8; hop++) {
            const parsedHop = new URL(hopUrl);

            // Unwrap Google consent redirect (?continue=https://www.google.com/maps/...)
            if (parsedHop.hostname.includes('consent.google.')) {
              const cont = parsedHop.searchParams.get('continue');
              if (cont) {
                hopUrl = cont;
                finalUrl = cont;
                recordFromUrl(cont);
                continue;
              }
            }

            if (!ALLOWED_MAP_HOST_RE.test(parsedHop.hostname)) break;

            const resp = await fetch(hopUrl, {
              method: 'GET',
              redirect: 'manual',
              signal: controller.signal,
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                Cookie: 'CONSENT=YES+cb.20210720-07-p0.en+FX+410',
              },
            });

            const loc = resp.headers.get('location');
            if (loc) {
              hopUrl = new URL(loc, hopUrl).toString();
              finalUrl = hopUrl;
              recordFromUrl(hopUrl);
              // Keep following short links until we reach the canonical Google Maps URL
              if (bestLat !== undefined && bestLng !== undefined && bestName) break;
              continue;
            }

            // On final response, inspect meta og:title ONLY if we still need a place name
            if (!bestName && resp.ok) {
              const html = await resp.text();
              const ogTitle =
                html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                html.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1] ||
                html.match(/itemprop=["']name["'][^>]*content=["']([^"']+)["']/i)?.[1];
              if (ogTitle && !/^google\s+maps$/i.test(ogTitle.trim())) {
                bestName = ogTitle
                  .replace(/\s*[-·|]\s*Google\s+Maps\s*$/i, '')
                  .replace(/&#39;/g, "'")
                  .replace(/&amp;/g, '&')
                  .trim();
              }
              // Extract embedded !3d...!4d... inside canonical URL / meta links (NOT generic staticmap center)
              if (bestLat === undefined) {
                const canonicalLink =
                  html.match(/https:\/\/www\.google\.com\/maps\/place\/[^"'\\s<>]+/i)?.[0] || '';
                if (canonicalLink) {
                  recordFromUrl(canonicalLink);
                }
              }
            }
            break;
          }
        } finally {
          clearTimeout(timeout);
        }

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            resolvedUrl: finalUrl,
            lat: bestLat,
            lng: bestLng,
            placeName: bestName,
          })
        );
      } catch (err) {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            ok: false,
            error: err instanceof Error ? err.message : 'Failed to resolve map link',
          })
        );
      }
    });
  };

  return {
    name: 'tadawol-map-link-resolver',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
  };
}

function readLocalEnvVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const filename of ['.env', '.env.local', '../.env', '../.env.local']) {
    try {
      const fullPath = path.resolve(process.cwd(), filename);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx <= 0) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1).trim();
        }
        if (key && val) vars[key] = val;
      }
    } catch {
      // ignore missing/unreadable env file
    }
  }
  return vars;
}

interface ResolvedAiBackend {
  provider: 'groq' | 'gemini' | 'openrouter' | 'xai' | 'pollinations';
  providerLabel: string;
  endpoint: string;
  apiKey: string;
  models: string[];
  extraHeaders?: Record<string, string>;
}

function resolveServerAiBackend(): ResolvedAiBackend {
  const fileEnv = readLocalEnvVars();
  const getEnv = (name: string) => (process.env[name] || fileEnv[name] || '').trim();

  const groqKey = getEnv('GROQ_API_KEY') || getEnv('VITE_GROQ_API_KEY') || getEnv('LLM_API_KEY');
  if (groqKey) {
    const preferred = getEnv('GROQ_MODEL') || getEnv('ADVISOR_MODEL') || 'openai/gpt-oss-120b';
    return {
      provider: 'groq',
      providerLabel: 'Groq AI',
      endpoint: `${(getEnv('LLM_BASE_URL') || 'https://api.groq.com/openai/v1').replace(/\/+$/, '')}/chat/completions`,
      apiKey: groqKey,
      models: Array.from(
        new Set([preferred, 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'])
      ),
    };
  }

  const geminiKey = getEnv('GEMINI_API_KEY') || getEnv('GOOGLE_API_KEY');
  if (geminiKey) {
    return {
      provider: 'gemini',
      providerLabel: 'Gemini AI',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      apiKey: geminiKey,
      models: [getEnv('GEMINI_MODEL') || 'gemini-2.5-flash', 'gemini-2.0-flash'],
    };
  }

  const openRouterKey = getEnv('OPENROUTER_API_KEY');
  if (openRouterKey) {
    return {
      provider: 'openrouter',
      providerLabel: 'OpenRouter AI',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: openRouterKey,
      models: [
        getEnv('OPENROUTER_MODEL') || 'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemma-3-27b-it:free',
      ],
      extraHeaders: {
        'HTTP-Referer': 'https://tadawol.app',
        'X-Title': 'Tadawol Crop Rotation Advisor',
      },
    };
  }

  const xaiKey =
    getEnv('XAI_API_KEY') || getEnv('VITE_XAI_API_KEY') || getEnv('VITE_GROK_API_KEY');
  if (xaiKey) {
    const isGroqPrefixed = xaiKey.startsWith('gsk_');
    if (isGroqPrefixed) {
      return {
        provider: 'groq',
        providerLabel: 'Groq AI',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: xaiKey,
        models: ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'],
      };
    }
    const preferred = getEnv('XAI_MODEL') || getEnv('VITE_XAI_MODEL') || 'grok-3-mini';
    return {
      provider: 'xai',
      providerLabel: 'Grok AI',
      endpoint: 'https://api.x.ai/v1/chat/completions',
      apiKey: xaiKey,
      models: Array.from(
        new Set([preferred, 'grok-3-mini', 'grok-3', 'grok-4-fast-non-reasoning'])
      ),
    };
  }

  return {
    provider: 'pollinations',
    providerLabel: 'Live AI',
    endpoint: 'https://text.pollinations.ai/openai',
    apiKey: '',
    models: ['openai'],
  };
}

function grokAiProxyPlugin(): Plugin {
  let pollinationsCooldownUntil = 0;

  const attachMiddleware = (middlewares: Connect.Server) => {
    middlewares.use('/api/ai-status', (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (req.method !== 'GET') {
        res.statusCode = 405;
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
        return;
      }
      const backend = resolveServerAiBackend();
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          serverConfigured: backend.provider !== 'pollinations',
          provider: backend.provider,
          providerLabel: backend.providerLabel,
          defaultModel: backend.models[0],
        })
      );
    });

    middlewares.use('/api/ai-chat', async (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
        return;
      }

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const rawBody = Buffer.concat(chunks).toString('utf8');
        const payload = JSON.parse(rawBody || '{}') as {
          messages?: { role: string; content: string }[];
          temperature?: number;
          max_tokens?: number;
        };

        const backend = resolveServerAiBackend();

        // Skip hammering anonymous Pollinations during its 45s per-IP cooldown
        if (backend.provider === 'pollinations' && Date.now() < pollinationsCooldownUntil) {
          res.statusCode = 429;
          res.end(JSON.stringify({ ok: false, error: 'Free public AI cooldown active' }));
          return;
        }

        let lastStatus = 502;
        let lastError = 'AI request failed';

        for (const model of backend.models) {
          const controller = new AbortController();
          const timeoutMs = backend.provider === 'pollinations' ? 14000 : 22000;
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              ...(backend.extraHeaders ?? {}),
            };
            if (backend.apiKey) {
              headers.Authorization = `Bearer ${backend.apiKey}`;
            }

            const isGptOss = model.includes('gpt-oss');
            const requestBody: Record<string, unknown> = {
              model,
              messages: payload.messages ?? [],
              temperature: payload.temperature ?? 0.45,
              max_tokens:
                backend.provider === 'pollinations'
                  ? 650
                  : isGptOss
                    ? 2600
                    : (payload.max_tokens ?? 1400),
            };
            if (backend.provider === 'pollinations' || isGptOss) {
              requestBody.reasoning_effort = 'low';
            }

            const upstream = await fetch(backend.endpoint, {
              method: 'POST',
              signal: controller.signal,
              headers,
              body: JSON.stringify(requestBody),
            });

            const data = (await upstream.json().catch(() => ({}))) as {
              choices?: { message?: { content?: string } }[];
              error?: { message?: string } | string;
              model?: string;
            };

            const rawContent = data.choices?.[0]?.message?.content;
            if (upstream.ok && rawContent) {
              const cleanContent = rawContent
                .replace(/<think>[\s\S]*?<\/think>/gi, '')
                .replace(/\u2014/g, ', ')
                .trim();
              if (backend.provider === 'pollinations') {
                pollinationsCooldownUntil = Date.now() + 44000;
              }
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  ok: true,
                  provider: backend.provider,
                  model: data.model || model,
                  content: cleanContent,
                })
              );
              return;
            }

            lastStatus = upstream.status;
            lastError =
              typeof data.error === 'string'
                ? data.error
                : data.error?.message || `HTTP ${upstream.status}`;

            if (backend.provider === 'pollinations' && (upstream.status === 402 || upstream.status === 429)) {
              pollinationsCooldownUntil = Date.now() + 44000;
              break;
            }

            const modelNotFound =
              upstream.status === 404 ||
              (upstream.status === 400 && /model/i.test(lastError));
            if (!modelNotFound) {
              break;
            }
          } finally {
            clearTimeout(timer);
          }
        }

        res.statusCode = lastStatus >= 400 && lastStatus < 600 ? lastStatus : 502;
        res.end(JSON.stringify({ ok: false, error: lastError }));
      } catch (err) {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            ok: false,
            error: err instanceof Error ? err.message : 'Failed to reach AI backend',
          })
        );
      }
    });

    // Server-side cached batch UI translation endpoint for all 22 languages covering all 42 countries
    const serverTranslationCache = new Map<string, string>();
    middlewares.use('/api/translate', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as {
          targetLang?: string;
          targetLangName?: string;
          texts?: string[];
        };
        const targetLang = (body.targetLang || '').trim().toLowerCase();
        const targetLangName = (body.targetLangName || targetLang).trim();
        const rawTexts = Array.isArray(body.texts) ? body.texts.slice(0, 45) : [];

        if (!targetLang || targetLang === 'en' || rawTexts.length === 0) {
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, translations: rawTexts }));
          return;
        }

        const results: (string | null)[] = rawTexts.map((txt) => {
          const hit = serverTranslationCache.get(`${targetLang}::${txt}`);
          return hit ?? null;
        });

        const missingIndices: number[] = [];
        const missingTexts: string[] = [];
        results.forEach((val, idx) => {
          if (val === null) {
            missingIndices.push(idx);
            missingTexts.push(rawTexts[idx]);
          }
        });

        if (missingTexts.length === 0) {
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, cached: true, translations: results }));
          return;
        }

        const backend = resolveServerAiBackend();
        const translateModels =
          backend.provider === 'groq'
            ? ['openai/gpt-oss-20b', ...backend.models.filter((m) => m !== 'openai/gpt-oss-20b')]
            : backend.models;

        let translatedMissing: string[] | null = null;
        for (const model of translateModels) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 16000);
          try {
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              ...(backend.extraHeaders ?? {}),
            };
            if (backend.apiKey) headers.Authorization = `Bearer ${backend.apiKey}`;

            const isGptOss = model.includes('gpt-oss');
            const reqPayload: Record<string, unknown> = {
              model,
              temperature: 0.15,
              max_tokens: isGptOss ? 2800 : 1800,
              messages: [
                {
                  role: 'system',
                  content: `You are a professional agricultural UI translator. Translate every string in the input JSON array from English into ${targetLangName} (${targetLang}). Keep the brand name "Tadawol", NASA POWER, numbers, currency codes (TND, EUR, USD, etc.), units (ha, t/ha, mm, °C, %), and emojis intact. Be natural, concise, and farmer-friendly. Never use em-dashes. Return ONLY a valid JSON array of strings of the EXACT same length as the input array, with no markdown fences or extra commentary.`,
                },
                {
                  role: 'user',
                  content: JSON.stringify(missingTexts),
                },
              ],
            };
            if (isGptOss) reqPayload.reasoning_effort = 'low';

            const upstream = await fetch(backend.endpoint, {
              method: 'POST',
              signal: controller.signal,
              headers,
              body: JSON.stringify(reqPayload),
            });

            if (!upstream.ok) continue;
            const data = (await upstream.json().catch(() => ({}))) as {
              choices?: { message?: { content?: string } }[];
            };
            const raw = (data.choices?.[0]?.message?.content || '')
              .replace(/<think>[\s\S]*?<\/think>/gi, '')
              .replace(/```json\s*/gi, '')
              .replace(/```/g, '')
              .trim();
            const startIdx = raw.indexOf('[');
            const endIdx = raw.lastIndexOf(']');
            if (startIdx >= 0 && endIdx > startIdx) {
              const parsed = JSON.parse(raw.slice(startIdx, endIdx + 1)) as unknown;
              if (Array.isArray(parsed) && parsed.length === missingTexts.length) {
                translatedMissing = parsed.map((item, i) =>
                  typeof item === 'string' && item.trim()
                    ? item.replace(/\u2014/g, ', ').trim()
                    : missingTexts[i]
                );
                break;
              }
            }
          } catch {
            // Try fallback model
          } finally {
            clearTimeout(timer);
          }
        }

        if (translatedMissing) {
          missingIndices.forEach((origIdx, k) => {
            const tr = translatedMissing![k];
            results[origIdx] = tr;
            serverTranslationCache.set(`${targetLang}::${rawTexts[origIdx]}`, tr);
          });
        }

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            translations: results.map((v, i) => v ?? rawTexts[i]),
          })
        );
      } catch (err) {
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: false,
            error: err instanceof Error ? err.message : 'Translation failed',
            translations: [],
          })
        );
      }
    });
  };

  return {
    name: 'tadawol-grok-ai-proxy',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
  };
}

export default defineConfig({
  plugins: [react(), mapLinkResolverPlugin(), grokAiProxyPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    cors: true,
    watch: {
      ignored: ['**/.npm/**', '**/.cache/**', '**/dist/**', '**/node_modules/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
});
