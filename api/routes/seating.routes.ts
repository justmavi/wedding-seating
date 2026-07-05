import { Router } from "express";
import { seatingController } from "../controllers/seating.controller.js";

export const seatingRouter = Router();

seatingRouter.get("/tables", seatingController.getTables);
seatingRouter.get("/tables/:num", seatingController.getTable);
seatingRouter.get("/search", seatingController.search);
seatingRouter.post("/tables/:num/guests", seatingController.addGuest);
seatingRouter.delete("/guests/:id", seatingController.removeGuest);
seatingRouter.post("/guests/move", seatingController.moveGuests);
