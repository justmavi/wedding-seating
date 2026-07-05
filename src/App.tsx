import { useCallback, useEffect, useRef, useState } from "react";
import type { TableSummary } from "./types";
import { CAPACITY } from "./types";
import { api } from "./api";
import HallMap from "./components/HallMap";
import TableDetail from "./components/TableDetail";

interface PendingMove {
  guestIds: number[];
  fromTable: number;
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDone, 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        padding: "11px 20px",
        borderRadius: 12,
        background: "#1f1f1d",
        color: "#fff",
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 4px 18px rgba(0,0,0,0.22)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      ✓ &nbsp;{message}
    </div>
  );
}

export default function App() {
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setTables(await api.getTables());
      setError(null);
    } catch (e: any) {
      setError(e.message || "Չհաջողվեց բեռնել սեղանները");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMoveTo = (guestIds: number[], fromTable: number) => {
    setPendingMove({ guestIds, fromTable });
    setCurrent(null);
  };

  const handlePickTable = async (toTable: number) => {
    if (!pendingMove) return;
    const count = pendingMove.guestIds.length;
    try {
      await api.moveGuests(pendingMove.guestIds, toTable);
      await refresh();
      setError(null);
      showToast(
        count === 1
          ? `Հյուրը տեղափոխվեց №${toTable} սեղան`
          : `${count} հյուր տեղափոխվեց №${toTable} սեղան`
      );
    } catch (e: any) {
      setError(e.message || "Տեղափոխումը ձախողվեց");
    }
    setCurrent(pendingMove.fromTable);
    setPendingMove(null);
  };

  const disabledTables = pendingMove
    ? new Set(
        tables
          .filter(
            (t) =>
              t.number === pendingMove.fromTable ||
              t.count + pendingMove.guestIds.length > CAPACITY
          )
          .map((t) => t.number)
      )
    : undefined;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 14px 48px", overflowX: "hidden" }}>
      {error && (
        <div
          style={{
            margin: "0 0 14px",
            padding: "10px 13px",
            borderRadius: 10,
            background: "#fdecec",
            border: "1px solid #f0c6c6",
            color: "#a23838",
            fontSize: 14,
          }}
        >
          {error} — արդյո՞ք API-ն աշխատում է և DATABASE_URL-ը սահմանված է
        </div>
      )}

      {current === null ? (
        <HallMap
          tables={tables}
          loading={loading}
          onOpen={(n) => setCurrent(n)}
          pickMode={pendingMove !== null}
          disabledTables={disabledTables}
          guestsToMove={pendingMove?.guestIds.length}
          onPick={handlePickTable}
          onCancelPick={() => {
            if (pendingMove) setCurrent(pendingMove.fromTable);
            setPendingMove(null);
          }}
        />
      ) : (
        <TableDetail
          num={current}
          onBack={() => setCurrent(null)}
          onChanged={refresh}
          onError={setError}
          onMoveTo={(guestIds) => handleMoveTo(guestIds, current)}
          onSuccess={showToast}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
