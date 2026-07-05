import { CAPACITY, TABLE_COUNT } from "../constants.js";
import { badRequest, conflict } from "../errors.js";
import { guestsRepository, type Guest } from "../repositories/guests.repository.js";

export interface TableSummary {
  number: number;
  count: number;
}

export interface TableDetail {
  number: number;
  guests: Guest[];
}

export const seatingService = {
  // Counts for every table (1..TABLE_COUNT), including empty ones.
  async getTablesSummary(): Promise<TableSummary[]> {
    const counts = await guestsRepository.countsByTable();
    const byTable = new Map(counts.map((c) => [c.table_number, c.count]));
    return Array.from({ length: TABLE_COUNT }, (_, i) => {
      const number = i + 1;
      return { number, count: byTable.get(number) ?? 0 };
    });
  },

  async getTable(tableNumber: number): Promise<TableDetail> {
    const guests = await guestsRepository.findByTable(tableNumber);
    return { number: tableNumber, guests };
  },

  search(query: string): Promise<Guest[]> {
    const q = query.trim();
    if (!q) return Promise.resolve([]);
    return guestsRepository.searchByName(q);
  },

  async addGuest(tableNumber: number, rawName: string): Promise<Guest> {
    const name = rawName.trim();
    if (!name) throw badRequest("Հյուրի անունը պարտադիր է");

    const count = await guestsRepository.countInTable(tableNumber);
    if (count >= CAPACITY) {
      throw conflict(`№${tableNumber} սեղանը լցված է (առավելագույնը ${CAPACITY}):`);
    }
    return guestsRepository.insert(name, tableNumber);
  },

  removeGuest(id: number): Promise<void> {
    return guestsRepository.deleteById(id);
  },

  // Move guests to a table atomically, rejecting the move if it would exceed
  // the table's capacity. Guests already seated there don't consume new seats.
  async moveGuests(ids: number[], to: number): Promise<number> {
    return guestsRepository.transaction(async (trx) => {
      const current = await guestsRepository.countInTable(to, trx);
      const already = await guestsRepository.countAmongInTable(to, ids, trx);
      const incoming = ids.length - already;
      const room = CAPACITY - current;

      if (incoming > room) {
        throw conflict(
          `№${to} սեղանում կա ընդամենը ${Math.max(room, 0)} ազատ տեղ:`
        );
      }

      await guestsRepository.setTable(ids, to, trx);
      return ids.length;
    });
  },
};
