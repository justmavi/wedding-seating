import { useCallback, useEffect, useMemo, useState } from "react";
import type { Guest } from "../types";
import { CAPACITY } from "../types";
import { api } from "../api";
import Spinner from "./Spinner";

interface Props {
  num: number;
  onBack: () => void;
  onChanged: () => void;
  onError: (msg: string | null) => void;
  onMoveTo: (guestIds: number[]) => void;
  onSuccess: (msg: string) => void;
}

function countColor(count: number) {
  return count >= CAPACITY ? "#b26a26" : count > 0 ? "#4f7049" : "#a5a59d";
}

export default function TableDetail({
  num,
  onBack,
  onChanged,
  onError,
  onMoveTo,
  onSuccess,
}: Props) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [addName, setAddName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getTable(num);
      setGuests(data.guests);
      onError(null);
    } catch (e: any) {
      onError(e.message || "Չհաջողվեց բեռնել սեղանը");
    } finally {
      setLoading(false);
    }
  }, [num, onError]);

  useEffect(() => {
    setSelected([]);
    setSearch("");
    setAddName("");
    setLoading(true);
    load();
  }, [num, load]);

  const run = async (fn: () => Promise<unknown>, successMsg?: string) => {
    setBusy(true);
    try {
      await fn();
      await load();
      onChanged();
      if (successMsg) onSuccess(successMsg);
    } catch (e: any) {
      onError(e.message || "Գործողությունը ձախողվեց");
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? guests.filter((g) => g.name.toLowerCase().includes(q)) : guests;
  }, [guests, search]);

  const addGuest = () => {
    const name = addName.trim();
    if (!name || busy) return;
    run(async () => {
      await api.addGuest(num, name);
      setAddName("");
    }, `${name}ն ավելացվեց №${num} սեղանին`);
  };

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const bulkRemove = () => {
    const n = selected.length;
    if (!confirm(`Հեռացնե՞լ ${n} ընտրված հյուրին:`)) return;
    run(async () => {
      for (const id of selected) await api.removeGuest(id);
      setSelected([]);
    }, n === 1 ? "Հյուրը հեռացվեց" : `${n} հյուր հեռացվեց`);
  };

  const count = guests.length;

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          padding: "6px 0",
          fontSize: 14,
          color: "#6b6b64",
          marginBottom: 6,
        }}
      >
        ← Վերադառնալ դահլիճ
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>№{num} սեղան</h1>
        <span style={{ fontSize: 15, fontWeight: 600, color: countColor(count) }}>
          {loading ? "" : `${count}/${CAPACITY} տեղ`}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGuest()}
          placeholder="Ավելացնել հյուրի անունը…"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "11px 13px",
            fontSize: 16,
            border: "1px solid #d6d6d0",
            borderRadius: 10,
            background: "#fff",
            outline: "none",
          }}
        />
        <button
          onClick={addGuest}
          disabled={busy}
          style={{
            padding: "0 18px",
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            background: "#1f1f1d",
            border: "none",
            borderRadius: 10,
            whiteSpace: "nowrap",
            opacity: busy ? 0.6 : 1,
          }}
        >
          Ավելացնել
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Փնտրել այս սեղանում…"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "9px 13px",
            fontSize: 16,
            border: "1px solid #e2e2dc",
            borderRadius: 10,
            background: "#fff",
            outline: "none",
          }}
        />
        {filtered.length > 0 && (
          selected.length === filtered.length ? (
            <button
              onClick={() => setSelected([])}
              style={{
                padding: "0 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "#33415c",
                background: "#eef1f6",
                border: "1px solid #c5cdda",
                borderRadius: 10,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              Չեղարկել ընտրությունը
            </button>
          ) : (
            <button
              onClick={() => setSelected(filtered.map((g) => g.id))}
              style={{
                padding: "0 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "#33415c",
                background: "#eef1f6",
                border: "1px solid #c5cdda",
                borderRadius: 10,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              Ընտրել բոլորը
            </button>
          )
        )}
      </div>

      {selected.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            marginBottom: 12,
            background: "#eef1f6",
            border: "1px solid #d3dae6",
            borderRadius: 10,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "#33415c" }}>
            {selected.length} ընտրված
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => onMoveTo(selected)}
            disabled={busy}
            style={{
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: "#33415c",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Տեղափոխել…
          </button>
          <button
            onClick={bulkRemove}
            disabled={busy}
            style={{
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 600,
              color: "#b23b3b",
              background: "#fff",
              border: "1px solid #e0b6b6",
              borderRadius: 8,
            }}
          >
            Հեռացնել
          </button>
        </div>
      )}

      <div
        style={{
          border: "1px solid #e2e2dc",
          borderRadius: 12,
          background: "#fff",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Spinner label="Բեռնվում են հյուրերը…" padding="clamp(36px, 12vw, 64px) 16px" />
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "22px 14px",
              textAlign: "center",
              fontSize: 14,
              color: "#a5a59d",
            }}
          >
            {search.trim()
              ? "Այս սեղանում համընկնումներ չկան:"
              : "Դեռ հյուրեր չկան — ավելացրեք որևէ մեկին վերևում:"}
          </div>
        ) : (
          filtered.map((g) => (
            <div
              key={g.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 10px",
                borderBottom: "1px solid #f0f0ea",
                minWidth: 0,
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(g.id)}
                onChange={() => toggle(g.id)}
                style={{ width: 18, height: 18, flex: "0 0 18px", cursor: "pointer" }}
              />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 15,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {g.name}
              </span>
              <button
                onClick={() => onMoveTo([g.id])}
                style={{
                  flex: "0 0 auto",
                  padding: "6px 10px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#33415c",
                  background: "#eef1f6",
                  border: "1px solid #c5cdda",
                  borderRadius: 8,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Տեղափոխել
              </button>
              <button
                onClick={() => {
                  if (!confirm(`Հեռացնե՞լ ${g.name}-ին:`)) return;
                  run(() => api.removeGuest(g.id), `${g.name}${g.name.endsWith('ի') ? 'ն' : 'ը'} հեռացվեց`);
                }}
                style={{
                  flex: "0 0 28px",
                  width: 28,
                  height: 28,
                  fontSize: 16,
                  lineHeight: 1,
                  color: "#b23b3b",
                  background: "#fff",
                  border: "1px solid #ecd4d4",
                  borderRadius: 8,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
