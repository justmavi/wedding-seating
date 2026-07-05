import { useEffect, useMemo, useState } from "react";
import type { Guest, TableSummary } from "../types";
import { CAPACITY } from "../types";
import { api } from "../api";

interface Props {
  tables: TableSummary[];
  loading: boolean;
  onOpen: (num: number) => void;
  pickMode?: boolean;
  disabledTables?: Set<number>;
  guestsToMove?: number;
  onPick?: (num: number) => void;
  onCancelPick?: () => void;
}

// Right side: numbered bottom-to-top (row 0 = bottom = tables 1,2).
// Left side: numbered top-to-bottom (row 0 = top = tables 17,18; bottom = 31,32).
function rightOrder(): number[] {
  const nums: number[] = [];
  for (let t = 0; t < 8; t++) {
    const r = 7 - t;
    nums.push(2 * r + 1, 2 * r + 2);
  }
  return nums;
}
function leftOrder(): number[] {
  const nums: number[] = [];
  for (let t = 0; t < 8; t++) {
    nums.push(16 + 2 * t + 1, 16 + 2 * t + 2);
  }
  return nums;
}
const RIGHT_NUMS = rightOrder(); // 1..16, bottom row = 1,2
const LEFT_NUMS = leftOrder();   // 17..32, bottom row = 31,32

function tableColors(count: number) {
  const full = count >= CAPACITY;
  return {
    border: full ? "#c98a4a" : count > 0 ? "#6f8f6a" : "#c9c9c2",
    bg: full ? "#f6e6d4" : count > 0 ? "#e9f0e7" : "#ffffff",
    countColor: full ? "#b26a26" : count > 0 ? "#4f7049" : "#a5a59d",
  };
}

export default function HallMap({
  tables,
  loading,
  onOpen,
  pickMode = false,
  disabledTables,
  guestsToMove,
  onPick,
  onCancelPick,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Guest[] | null>(null);

  const countOf = useMemo(() => {
    const map = new Map<number, number>();
    for (const t of tables) map.set(t.number, t.count);
    return (n: number) => map.get(n) ?? 0;
  }, [tables]);

  const total = useMemo(
    () => tables.reduce((sum, t) => sum + t.count, 0),
    [tables]
  );

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    let active = true;
    const id = setTimeout(() => {
      api
        .search(q)
        .then((r) => active && setResults(r))
        .catch(() => active && setResults([]));
    }, 180);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [query]);

  const renderSide = (nums: number[]) => (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 7,
      }}
    >
      {nums.map((num) => {
        const count = countOf(num);
        const disabled = pickMode && disabledTables?.has(num);
        const c = disabled
          ? { border: "#d0d0ca", bg: "#f4f4f1", countColor: "#b0b0a8" }
          : tableColors(count);
        return (
          <button
            key={num}
            onClick={() => (pickMode && !disabled ? onPick?.(num) : !pickMode ? onOpen(num) : undefined)}
            disabled={disabled}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              aspectRatio: "1 / 1",
              width: "100%",
              borderRadius: "50%",
              border: `2px solid ${c.border}`,
              background: c.bg,
              color: disabled ? "#b0b0a8" : "#1f1f1d",
              padding: 4,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.55 : 1,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "clamp(12px,3vw,15px)" }}>
              #{num}
            </span>
            <span style={{ fontSize: "clamp(10px,2.6vw,13px)", color: c.countColor }}>
              {count}/{CAPACITY}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      {pickMode ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "12px 14px",
            marginBottom: 14,
            background: "#eef1f6",
            border: "1px solid #c5cdda",
            borderRadius: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#33415c" }}>
              Ընտրեք սեղան՝ {guestsToMove === 1 ? "1 հյուրին" : `${guestsToMove} հյուրին`} տեղափոխելու համար
            </div>
            <div style={{ fontSize: 13, color: "#6b7a96", marginTop: 2 }}>
              Մոխրագույն սեղանները լցված են կամ ելակետային սեղանն են
            </div>
          </div>
          <button
            onClick={onCancelPick}
            style={{
              padding: "7px 14px",
              fontSize: 14,
              fontWeight: 600,
              color: "#33415c",
              background: "#fff",
              border: "1px solid #c5cdda",
              borderRadius: 8,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            Չեղարկել
          </button>
        </div>
      ) : (
        <>
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
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Հարսանիքի նստատեղեր</h1>
            <span style={{ fontSize: 13, color: "#8a8a84" }}>
              {loading ? "Բեռնվում է…" : `${total} հյուր նստեցված`}
            </span>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Փնտրել հյուրին բոլոր սեղաններում…"
            style={{
              width: "100%",
              padding: "11px 13px",
              fontSize: 16,
              border: "1px solid #d6d6d0",
              borderRadius: 10,
              background: "#fff",
              outline: "none",
            }}
          />
        </>
      )}

      {results !== null && (
        <div
          style={{
            margin: "8px 0 16px",
            border: "1px solid #e2e2dc",
            borderRadius: 10,
            background: "#fff",
            overflow: "hidden",
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: 14, fontSize: 14, color: "#8a8a84" }}>
              Հյուրեր չեն գտնվել:
            </div>
          ) : (
            results.map((g) => (
              <button
                key={g.id}
                onClick={() => onOpen(g.table_number)}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "11px 13px",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid #f0f0ea",
                  textAlign: "left",
                  fontSize: 14,
                  color: "#1f1f1d",
                }}
              >
                <span>{g.name}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#6b6b64",
                    whiteSpace: "nowrap",
                  }}
                >
                  №{g.table_number} սեղան
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          padding: "14px 10px",
          border: "1px solid #e2e2dc",
          borderRadius: 14,
          background: "#fbfbf9",
        }}
      >
        <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
          {renderSide(LEFT_NUMS)}

          <div
            style={{
              flex: "0 0 clamp(72px,18vw,150px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 8,
              padding: "2px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "8px 6px",
                minHeight: 64,
                border: "2px solid #b58a3c",
                background: "#fbf3e2",
                borderRadius: 8,
                fontSize: "clamp(10px,2.4vw,13px)",
                fontWeight: 600,
                color: "#8a6414",
                lineHeight: 1.25,
              }}
            >
              Հարս և Փեսա
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "8px 6px",
                minHeight: 56,
                border: "2px dashed #9a9a92",
                background: "#efefe9",
                borderRadius: 8,
                fontSize: "clamp(10px,2.4vw,13px)",
                fontWeight: 600,
                color: "#6b6b64",
              }}
            >
              Բեմ
            </div>
          </div>

          {renderSide(RIGHT_NUMS)}
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: 12,
            fontSize: 11,
            color: "#a5a59d",
          }}
        >
          {pickMode
            ? "Դահլիճի առջևը  ·  հպեք հասանելի սեղանին՝ հյուրերին այնտեղ տեղափոխելու համար"
            : "Դահլիճի առջևը  ·  հպեք սեղանին՝ հյուրերին խմբագրելու համար"}
        </div>
      </div>
    </div>
  );
}
