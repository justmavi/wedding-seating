import type { Request, Response, NextFunction } from "express";
import { TABLE_COUNT } from "../constants.js";
import { badRequest } from "../errors.js";
import { seatingService } from "../services/seating.service.js";

function parseTable(value: unknown): number {
  const n = Number(value);

  if (Number.isInteger(n) && n >= 1 && n <= TABLE_COUNT) return n;

  throw badRequest("Անվավեր սեղանի համար");
}

export const seatingController = {
  async getTables(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await seatingService.getTablesSummary());
    } catch (err) {
      next(err);
    }
  },

  async getTable(req: Request, res: Response, next: NextFunction) {
    try {
      const num = parseTable(req.params.num);
      res.json(await seatingService.getTable(num));
    } catch (err) {
      next(err);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = String(req.query.q ?? "");
      res.json(await seatingService.search(q));
    } catch (err) {
      next(err);
    }
  },

  async addGuest(req: Request, res: Response, next: NextFunction) {
    try {
      const num = parseTable(req.params.num);
      const name = String(req.body?.name ?? "");
      const guest = await seatingService.addGuest(num, name);
      res.status(201).json(guest);
    } catch (err) {
      next(err);
    }
  },

  async removeGuest(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) throw badRequest("Անվավեր նույնացուցիչ");
      await seatingService.removeGuest(id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  async moveGuests(req: Request, res: Response, next: NextFunction) {
    try {
      const to = Number(req.body?.to);
      if (!Number.isInteger(to) || to < 1 || to > TABLE_COUNT) {
        throw badRequest("Անվավեր նպատակակետ սեղան");
      }
      const ids: number[] = Array.isArray(req.body?.ids)
        ? req.body.ids.map(Number).filter(Number.isInteger)
        : [];
      if (ids.length === 0) throw badRequest("Հյուրեր ընտրված չեն");

      const moved = await seatingService.moveGuests(ids, to);
      res.json({ ok: true, moved });
    } catch (err) {
      next(err);
    }
  },
};
