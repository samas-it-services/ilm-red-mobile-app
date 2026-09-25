// COPIED from ilm-red-unbound/packages/api-client by scripts/sync-api-client.mjs. Do not edit here.
// @ilm-red/api-client — the one way the web app and the mobile app call api.ilm.red.
//
// Calls are made by operationId, the name the contract gives each endpoint, so a screen reads
// `api.call('books', 'getBook', { path: { book_id } })` and TypeScript knows the path parameters,
// the query, the body and the success response from the contract itself. No runtime
// dependencies: it uses the platform's fetch, which both browsers and React Native have.
//
// Errors come back as ApiProblem (RFC 9457). Branch on `problem.slug`, never on the message.

import { OPERATIONS, SURFACE_HOST, type Surface } from './operations';
import type { SurfaceOperations } from './surfaces';

// ── types derived from the generated contracts ───────────────────────────────────────────────

type Ops<S extends Surface> = SurfaceOperations[S];
export type OperationId<S extends Surface> = keyof Ops<S> & keyof (typeof OPERATIONS)[S] & string;
type Op<S extends Surface, O extends OperationId<S>> = Ops<S>[O];

type Params<X> = X extends { parameters: infer P } ? P : {};
type Part<X, K extends string> = Params<X> extends { [k in K]?: infer V } ? V : never;
type Defined<T> = [T] extends [never] ? false : [T] extends [undefined] ? false : true;

type JsonOf<C> = C extends { content: { 'application/json': infer J } } ? J : undefined;
type BodyOf<X> = X extends { requestBody?: infer RB } ? JsonOf<NonNullable<RB>> : never;
type SuccessCodes = 200 | 201 | 202 | 204;

/** The parsed body of the operation's success response (undefined for 204). */
export type ResponseOf<S extends Surface, O extends OperationId<S>> =
  Op<S, O> extends { responses: infer R }
    ? { [C in keyof R]: C extends SuccessCodes ? JsonOf<R[C]> : never }[keyof R]
    : never;

/** What a call takes. `path` is required when the endpoint has path parameters. */
export type RequestOf<S extends Surface, O extends OperationId<S>> =
  (Defined<Part<Op<S, O>, 'path'>> extends true ? { path: Part<Op<S, O>, 'path'> } : { path?: undefined }) & {
    query?: Defined<Part<Op<S, O>, 'query'>> extends true ? Part<Op<S, O>, 'query'> : undefined;
    body?: Defined<BodyOf<Op<S, O>>> extends true ? BodyOf<Op<S, O>> : undefined;
    /** Sent as Idempotency-Key. Creates and anything that spends credits need one; see `idempotent`. */
    idempotencyKey?: string;
    /** Generate an Idempotency-Key for this call (reuse the same key when you retry). */
    idempotent?: boolean;
    /** Sent as If-Match: the ETag you read, so a stale write is refused with version_conflict. */
    ifMatch?: string;
    /** Sent as If-None-Match; a 304 resolves to `undefined`. */
    ifNoneMatch?: string;
    /** Sent as X-Audit-Reason. Staff writes that change someone else's data need one. */
    auditReason?: string;
    signal?: AbortSignal;
  };

// ── errors ───────────────────────────────────────────────────────────────────────────────────

export interface FieldError { path: string; code: string; message: string; limit?: unknown }

/** An RFC 9457 problem from the API (or a network failure, as slug `network_error`). */
export class ApiProblem extends Error {
  readonly status: number;
  readonly slug: string;
  readonly title: string;
  readonly detail?: string;
  readonly requestId?: string;
  readonly errors: FieldError[];
  readonly retryAfter?: number;
  readonly body: Record<string, unknown>;
  constructor(status: number, body: Record<string, unknown>, retryAfter?: number) {
    super(String(body.detail ?? body.title ?? body.slug ?? `HTTP ${status}`));
    this.name = 'ApiProblem';
    this.status = status;
    this.slug = String(body.slug ?? (status >= 500 ? 'internal_error' : 'unknown'));
    this.title = String(body.title ?? '');
    this.detail = body.detail === undefined ? undefined : String(body.detail);
    this.requestId = body.request_id === undefined ? undefined : String(body.request_id);
    this.errors = Array.isArray(body.errors) ? (body.errors as FieldError[]) : [];
    this.retryAfter = retryAfter;
    this.body = body;
  }
}

// ── client ───────────────────────────────────────────────────────────────────────────────────

export interface ClientOptions {
  /** Default https://api.ilm.red/v1. */
  publicBaseUrl?: string;
  /** Default https://admin.ilm.red/v1. */
  staffBaseUrl?: string;
  /** Returns the current session token (a Clerk JWT or an ilm_sk_ key), or null when signed out. */
  getToken?: () => Promise<string | null> | string | null;
  /** Identifies the caller in logs, e.g. "web/1.371.0" or "ios/2.4.0". */
  clientInfo?: string;
  fetch?: typeof fetch;
  /** Retries after 429 and 503 honouring Retry-After, for reads only. Default 1. */
  readRetries?: number;
}

function randomKey(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes); else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function fillPath(template: string, path: Record<string, unknown> | undefined): string {
  return template.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const v = path?.[name];
    if (v === undefined || v === null || v === '') throw new Error(`missing path parameter ${name} for ${template}`);
    return encodeURIComponent(String(v));
  });
}

function queryString(query: Record<string, unknown> | undefined): string {
  if (!query) return '';
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    qs.set(k, Array.isArray(v) ? v.map(String).join(',') : String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export function createApiClient(opts: ClientOptions = {}) {
  const bases = {
    public: (opts.publicBaseUrl ?? 'https://api.ilm.red/v1').replace(/\/$/, ''),
    staff: (opts.staffBaseUrl ?? 'https://admin.ilm.red/v1').replace(/\/$/, ''),
  };
  const doFetch = opts.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const readRetries = opts.readRetries ?? 1;

  async function call<S extends Surface, O extends OperationId<S>>(
    surface: S, operationId: O, req?: RequestOf<S, O>,
  ): Promise<ResponseOf<S, O>> {
    const entry = (OPERATIONS[surface] as Record<string, readonly [string, string]>)[operationId];
    if (!entry) throw new Error(`unknown operation ${surface}.${operationId}`);
    const [method, template] = entry;
    const r = (req ?? {}) as Record<string, unknown> & RequestOf<S, O>;
    const url = bases[SURFACE_HOST[surface]] + fillPath(template, r.path as Record<string, unknown> | undefined)
      + queryString(r.query as Record<string, unknown> | undefined);

    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = opts.getToken ? await opts.getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    if (opts.clientInfo) headers['X-Client-Info'] = opts.clientInfo;
    const idem = r.idempotencyKey ?? (r.idempotent ? randomKey() : undefined);
    if (idem) headers['Idempotency-Key'] = idem;
    if (r.ifMatch) headers['If-Match'] = r.ifMatch;
    if (r.ifNoneMatch) headers['If-None-Match'] = r.ifNoneMatch;
    if (r.auditReason) headers['X-Audit-Reason'] = r.auditReason;
    let body: string | undefined;
    if (r.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(r.body); }

    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await doFetch(url, { method, headers, body, signal: r.signal });
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') throw err;
        throw new ApiProblem(0, { slug: 'network_error', title: 'Could not reach the API', detail: String((err as Error)?.message ?? err) });
      }
      if (res.status === 304) return undefined as ResponseOf<S, O>;
      const text = await res.text();
      let json: unknown;
      try { json = text ? JSON.parse(text) : undefined; } catch { json = undefined; }
      // A non-JSON success (a CSV download, format=csv) comes back as its text.
      if (res.ok) return (json === undefined && text ? text : json) as ResponseOf<S, O>;
      const ra = res.headers.get('Retry-After');
      const retryAfter = ra !== null && ra.trim() !== '' && Number.isFinite(Number(ra)) ? Number(ra) : undefined;
      if (method === 'GET' && (res.status === 429 || res.status === 503) && attempt < readRetries) {
        await new Promise(ok => setTimeout(ok, Math.min(retryAfter ?? 1, 10) * 1000));
        continue;
      }
      const problem = json && typeof json === 'object' ? json as Record<string, unknown> : { title: text.slice(0, 200) };
      throw new ApiProblem(res.status, problem, retryAfter);
    }
  }

  /**
   * Walk every page of a list endpoint ({data, next_cursor}), yielding items one at a time.
   * Stops when next_cursor is null.
   */
  async function* pages<S extends Surface, O extends OperationId<S>>(
    surface: S, operationId: O, req?: RequestOf<S, O>,
  ): AsyncGenerator<ResponseOf<S, O> extends { data?: (infer T)[] } ? T : never> {
    let cursor: string | null | undefined;
    do {
      const r = { ...(req ?? {}), query: { ...((req?.query as object) ?? {}), ...(cursor ? { cursor } : {}) } } as RequestOf<S, O>;
      const page = await call(surface, operationId, r) as { data?: unknown[]; next_cursor?: string | null };
      for (const item of page?.data ?? []) yield item as never;
      cursor = page?.next_cursor;
    } while (cursor);
  }

  return { call, pages };
}

export type ApiClient = ReturnType<typeof createApiClient>;
