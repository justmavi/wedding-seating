import type { Guest, TableSummary, TableDetailData } from "./types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Հարցումը ձախողվեց (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const json = { "Content-Type": "application/json" };

export const api = {
  getTables: () => fetch("/api/tables").then((r) => handle<TableSummary[]>(r)),

  getTable: (num: number) =>
    fetch(`/api/tables/${num}`).then((r) => handle<TableDetailData>(r)),

  search: (q: string) =>
    fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => handle<Guest[]>(r)),

  addGuest: (num: number, name: string) =>
    fetch(`/api/tables/${num}/guests`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ name }),
    }).then((r) => handle<Guest>(r)),

  removeGuest: (id: number) =>
    fetch(`/api/guests/${id}`, { method: "DELETE" }).then((r) =>
      handle<{ ok: boolean }>(r)
    ),

  moveGuests: (ids: number[], to: number) =>
    fetch("/api/guests/move", {
      method: "POST",
      headers: json,
      body: JSON.stringify({ ids, to }),
    }).then((r) => handle<{ ok: boolean }>(r)),
};
