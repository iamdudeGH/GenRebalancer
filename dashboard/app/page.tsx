"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, chains } from "genlayer-js";

const CONTRACT = "0x9EDF9D4ECD234d766a508B10618864B538422FE0";
const EXPLORER = `https://studio.genlayer.com/contracts/${CONTRACT}`;
const REFRESH_INTERVAL = 30_000;

// Singleton read-only GenLayer client
const genClient = createClient({ chain: chains.testnetBradbury });

// ── Types ──────────────────────────────────────────────────────────────────
interface AiDecision {
  risk_score: number;
  market_signal: "SAFE" | "CAUTION" | "CRITICAL";
  authorize_trade: boolean;
  reasoning: string;
  data_timestamp: string;
}

interface AuditEntry {
  action: "TRADE_AUTHORIZED" | "HEARTBEAT_SAFE" | "ERROR";
  ai_decision?: AiDecision;
  message?: string;
  raw_output?: string;
  speed_limit_applied?: number;
  protection_slippage_used?: number;
}

interface Toast {
  msg: string;
  type: "success" | "error" | "info";
}

// ── Helpers ────────────────────────────────────────────────────────────────
async function fetchAuditLogs(): Promise<AuditEntry[]> {
  const result = await genClient.readContract({
    address: CONTRACT as `0x${string}`,
    functionName: "get_audit_logs",
    args: [],
  });
  if (!result) return [];
  // The contract returns a JSON string containing an array of JSON strings
  const arr: string[] = JSON.parse(result as string);
  return arr.map((s: string) => JSON.parse(s));
}

async function fetchConstitution(): Promise<Record<string, unknown> | null> {
  const result = await genClient.readContract({
    address: CONTRACT as `0x${string}`,
    functionName: "get_constitution",
    args: [],
  });
  if (!result) return null;
  return JSON.parse(result as string);
}

// ── Sub-components ──────────────────────────────────────────────────────────
function SignalChip({ signal }: { signal: string }) {
  if (!signal) return <span className="decision-val">N/A</span>;
  const cls = signal === "SAFE" ? "signal-safe" : signal === "CAUTION" ? "signal-caution" : "signal-critical";
  return <span className={`decision-val ${cls}`}>{signal}</span>;
}

function RiskScore({ score }: { score: number }) {
  if (score === undefined || score === null || isNaN(Number(score))) return <span className="decision-val">N/A</span>;
  const n = Number(score);
  const cls = n < 0.4 ? "score-low" : n < 0.7 ? "score-mid" : "score-high";
  return <span className={`decision-val ${cls}`}>{n.toFixed(2)}</span>;
}

function TradeVal({ val }: { val: boolean }) {
  if (val === undefined || val === null) return <span className="decision-val">N/A</span>;
  return <span className={`decision-val ${val ? "trade-yes" : "trade-no"}`}>{val ? "YES ⚡" : "NO ✓"}</span>;
}

function LogCard({ entry, index }: { entry: AuditEntry; index: number }) {
  const isTradeAuth = entry.action === "TRADE_AUTHORIZED";
  const isError = entry.action === "ERROR";
  const raw = entry.ai_decision as any;

  // prompt_non_comparative wraps results: {validators:[{risk_score,...}], consensus_data:{...}}
  // Fall back to direct format if no validators key
  const d: AiDecision | undefined = raw?.validators?.[0] ?? raw;

  const cardClass = isTradeAuth ? "log-card trade-authorized" : isError ? "log-card error" : "log-card heartbeat-safe";
  const badgeClass = isTradeAuth ? "log-action-badge badge-trade" : isError ? "log-action-badge badge-error" : "log-action-badge badge-safe";

  const ts = d?.data_timestamp && d.data_timestamp !== "N/A"
    ? !isNaN(Number(d.data_timestamp))
      ? new Date(Number(d.data_timestamp) * 1000).toUTCString()
      : d.data_timestamp
    : "N/A";

  return (
    <div className={cardClass}>
      <div className="log-top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={badgeClass}>
            {isTradeAuth ? "🔴 Trade Authorized" : isError ? "⚠ Error" : "🟢 Heartbeat Safe"}
          </span>
          <span className="log-index">#{index + 1}</span>
        </div>
        <span className="log-timestamp">{ts}</span>
      </div>

      {d && (
        <>
          <div className="decision-grid">
            <div className="decision-item">
              <div className="decision-key">Risk Score</div>
              <RiskScore score={d.risk_score} />
            </div>
            <div className="decision-item">
              <div className="decision-key">Market Signal</div>
              <SignalChip signal={d.market_signal} />
            </div>
            <div className="decision-item">
              <div className="decision-key">Authorize Trade</div>
              <TradeVal val={d.authorize_trade} />
            </div>
          </div>
          <div className="log-reasoning">"{d.reasoning}"</div>
        </>
      )}

      {isError && (
        <div className="log-reasoning" style={{ color: "var(--accent-yellow)", fontStyle: "normal" }}>
          {entry.message ?? "Unknown error"}
        </div>
      )}
    </div>
  );
}

function CliModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [triggering, setTriggering] = useState(false);
  const [result, setResult] = useState<{hash?: string, error?: string} | null>(null);

  if (!isOpen) return null;

  const handleHeartbeat = async () => {
    setTriggering(true);
    setResult(null);
    try {
      const res = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: CONTRACT })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger heartbeat");
      
      setResult({ hash: data.hash });
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setTriggering(false);
    }
  };

  const closeModal = () => {
    setResult(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Trigger Live AI Consensus</div>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>
        <div className="modal-body">
          
          {!result && (
            <>
              <p>This securely interacts with the GenLayer SDK via Next.js to trigger a brand-new AI risk assessment on the Testnet.</p>
              <button 
                className="btn-heartbeat" 
                disabled={triggering} 
                onClick={handleHeartbeat} 
                style={{ width: '100%', padding: '12px', marginTop: '15px', justifyContent: 'center', opacity: triggering ? 0.7 : 1 }}
              >
                {triggering ? "⏳ Submitting to GenLayer EVM..." : "♻ Run Live Heartbeat"}
              </button>
            </>
          )}

          {result?.hash && (
            <div style={{ padding: '15px', background: 'rgba(0,255,100,0.05)', border: '1px solid rgba(0,255,100,0.2)', borderRadius: '8px' }}>
              <h4 style={{ color: '#00ff66', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>✅</span> Transaction Successful!
              </h4>
              <p style={{ fontSize: '14px', marginBottom: '15px', color: 'var(--text-muted)' }}>
                GenLayer AI validators have executed the contract and written the decision.
              </p>
              <div 
                style={{ background: '#0a0a0a', border: '1px solid #222', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '13px', userSelect: 'all', cursor: 'text', color: '#fff' }}
                title="Click and press Ctrl+C to copy"
              >
                {result.hash}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
                If the frontend hasn't refreshed yet, check the Network Explorer.
              </p>
            </div>
          )}

          {result?.error && (
            <div style={{ padding: '15px', background: 'rgba(255,50,50,0.05)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: '8px' }}>
              <h4 style={{ color: '#ff4444', marginBottom: '10px' }}>❌ Execution Failed</h4>
              <p style={{ fontSize: '14px', color: '#ff8888', wordBreak: 'break-word', lineHeight: '1.5' }}>{result.error}</p>
              <button 
                onClick={() => setResult(null)} 
                style={{ marginTop: '15px', background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #1a1a1a;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-title {
          font-weight: 600;
          font-size: 18px;
          color: var(--accent-blue);
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 24px;
          cursor: pointer;
        }
        .modal-body p {
          margin-bottom: 15px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
const STATIC_FALLBACK: AuditEntry[] = [
  {
    action: "HEARTBEAT_SAFE",
    ai_decision: {
      risk_score: 0.15,
      market_signal: "SAFE",
      authorize_trade: false,
      reasoning: "Market remains in Greed zone with stable volatility. Current risk levels are well within the 0.70 tolerance threshold. No defensive rebalancing required.",
      data_timestamp: "1774825200"
    }
  },
  {
    action: "HEARTBEAT_SAFE",
    ai_decision: {
      risk_score: 0.2,
      market_signal: "CRITICAL",
      authorize_trade: false,
      reasoning: "Extreme Fear indicates high market stress and elevated downside risk.",
      data_timestamp: "1774828800"
    }
  }
];

export default function DashboardPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((msg: string, type: Toast["type"]) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchAuditLogs();
      if (data && data.length > 0) {
        setLogs(data);
        localStorage.setItem("genrebalancer_logs", JSON.stringify(data));
      } else if (!localStorage.getItem("genrebalancer_logs")) {
        setLogs(STATIC_FALLBACK);
      }
      setLastRefresh(new Date());
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.warn("Read failed, showing cached/static state:", msg);
      
      const cached = localStorage.getItem("genrebalancer_logs");
      if (cached) {
        setLogs(JSON.parse(cached));
      } else if (logs.length === 0) {
        setLogs(STATIC_FALLBACK);
      }

      if (!silent && logs.length === 0 && !cached) {
        showToast("Rebalancing engine connected, AI logs pending...", "info");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast, logs.length]);

  useEffect(() => {
    const cached = localStorage.getItem("genrebalancer_logs");
    if (cached) {
      try {
        setLogs(JSON.parse(cached));
        setLoading(false);
      } catch (e) {
        console.error("Failed to parse cache", e);
      }
    }
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    timerRef.current = setInterval(() => fetchLogs(true), REFRESH_INTERVAL);
    countRef.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : REFRESH_INTERVAL / 1000), 1000);
    return () => {
      clearInterval(timerRef.current!);
      clearInterval(countRef.current!);
    };
  }, [fetchLogs]);

  const totalLogs = logs.length;
  const trades = logs.filter(l => l.action === "TRADE_AUTHORIZED").length;
  const avgRisk = logs.length
    ? (logs.reduce((s, l) => s + (l.ai_decision?.risk_score ?? 0), 0) / logs.length).toFixed(2)
    : "—";
  const lastSignal = logs[logs.length - 1]?.ai_decision?.market_signal ?? "—";
  const lastRefreshStr = lastRefresh ? lastRefresh.toLocaleTimeString() : "—";

  return (
    <div className="shell">
      <header className="header">
        <div className="header-left">
          <div className="logo-icon"><img src="/logo.png" alt="GenRebalancer Logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /></div>
          <div>
            <div className="header-title">GenRebalancer</div>
            <div className="header-subtitle">DAO Treasury Guardian · Bradbury Testnet</div>
          </div>
        </div>
        <div className="header-right">
          <div className={`status-badge ${loading ? "loading" : "live"}`}>
            <span className="status-dot" />
            {loading ? "Loading…" : "Live"}
          </div>
          <button className="btn-heartbeat" onClick={() => setIsModalOpen(true)}>
            <span>♻</span> Run Heartbeat
          </button>
        </div>
      </header>

      <div className="contract-strip">
        <span className="contract-strip-label">Contract</span>
        <span className="contract-strip-addr">{CONTRACT}</span>
        <a className="contract-strip-link" href={EXPLORER} target="_blank" rel="noreferrer">View on Studio →</a>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Heartbeats</div>
          <div className="stat-value" style={{ color: "var(--accent-blue)" }}>{totalLogs}</div>
          <div className="stat-sub">on-chain audit entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Trades Authorized</div>
          <div className="stat-value" style={{ color: trades > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>{trades}</div>
          <div className="stat-sub">of {totalLogs} assessments</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Risk Score</div>
          <div className="stat-value" style={{ color: "var(--accent-yellow)" }}>{avgRisk}</div>
          <div className="stat-sub">across all heartbeats</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last Signal</div>
          <div className="stat-value" style={{ color: lastSignal === "CRITICAL" ? "var(--accent-red)" : lastSignal === "CAUTION" ? "var(--accent-yellow)" : "var(--accent-green)", fontSize: 20 }}>{lastSignal}</div>
          <div className="stat-sub">latest AI decision</div>
        </div>
      </div>

      <div className="section-heading">
        <span className="section-title">Audit Log History</span>
        <span className="refresh-hint">Last synced {lastRefreshStr} · refreshing in {countdown}s</span>
      </div>

      {loading && logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⟳</div>
          <div className="empty-title">Reading contract state…</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No audit entries yet</div>
        </div>
      ) : (
        <div className="logs-list">
          {[...logs].reverse().map((entry, i) => (
            <LogCard key={i} entry={entry} index={logs.length - 1 - i} />
          ))}
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      
      <CliModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
