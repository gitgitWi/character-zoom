import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

router.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

router.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});

export default router;
