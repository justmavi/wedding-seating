import type { Knex } from "knex";
import { db } from "../db.js";

export interface Guest {
  id: number;
  name: string;
  table_number: number;
}

export interface TableCount {
  table_number: number;
  count: number;
}

const GUEST_COLUMNS = ["id", "name", "table_number"] as const;

// A Knex transaction, or the default connection when running outside one.
type Executor = Knex | Knex.Transaction;

export const guestsRepository = {
  // Number of guests grouped by table, empty tables omitted.
  async countsByTable(): Promise<TableCount[]> {
    const rows = await db("guests")
      .select("table_number")
      .count<{ table_number: number; count: string }[]>("* as count")
      .groupBy("table_number");
    return rows.map((r) => ({
      table_number: Number(r.table_number),
      count: Number(r.count),
    }));
  },

  findByTable(tableNumber: number): Promise<Guest[]> {
    return db("guests")
      .select(GUEST_COLUMNS)
      .where({ table_number: tableNumber })
      .orderBy("id");
  },

  searchByName(query: string, limit = 100): Promise<Guest[]> {
    return db("guests")
      .select(GUEST_COLUMNS)
      .whereILike("name", `%${query}%`)
      .orderBy("name", "asc")
      .limit(limit);
  },

  async countInTable(tableNumber: number, exec: Executor = db): Promise<number> {
    const [row] = await exec("guests")
      .where({ table_number: tableNumber })
      .count<{ count: string }[]>("* as count");
    return Number(row.count);
  },

  // How many of the given guests are already seated at the table.
  async countAmongInTable(
    tableNumber: number,
    ids: number[],
    exec: Executor = db
  ): Promise<number> {
    const [row] = await exec("guests")
      .where({ table_number: tableNumber })
      .whereIn("id", ids)
      .count<{ count: string }[]>("* as count");
    return Number(row.count);
  },

  async insert(name: string, tableNumber: number): Promise<Guest> {
    const [row] = await db("guests")
      .insert({ name, table_number: tableNumber })
      .returning(GUEST_COLUMNS);
    return row as Guest;
  },

  async deleteById(id: number): Promise<void> {
    await db("guests").where({ id }).del();
  },

  async setTable(
    ids: number[],
    tableNumber: number,
    exec: Executor = db
  ): Promise<void> {
    await exec("guests").whereIn("id", ids).update({ table_number: tableNumber });
  },

  transaction<T>(fn: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return db.transaction(fn);
  },
};
