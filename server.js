import express from "express";
import pg from "pg";

const { Pool } = pg;
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

app.get("/health", (req, res) => {
  res.json({ status: "online", service: "Goats Empire" });
});

app.get("/api/db-health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "connected", database: "PostgreSQL" });
  } catch (error) {
    console.error("Database check failed");
    res.status(503).json({ status: "disconnected" });
  }
});

app.get("/api/treasury", async (req, res) => {
  try {
    if (!TREASURY_ADDRESS) {
      return res.status(500).json({ error: "Treasury address not configured" });
    }

    const response = await fetch(
      `https://blockstream.info/api/address/${TREASURY_ADDRESS}`
    );

    if (!response.ok) {
      throw new Error("Blockchain provider unavailable");
    }

    const data = await response.json();

    const confirmed =
      data.chain_stats.funded_txo_sum -
      data.chain_stats.spent_txo_sum;

    const unconfirmed =
      data.mempool_stats.funded_txo_sum -
      data.mempool_stats.spent_txo_sum;

    res.json({
      network: "Bitcoin Mainnet",
      address: TREASURY_ADDRESS,
      confirmed_sats: confirmed,
      confirmed_btc: confirmed / 100000000,
      unconfirmed_sats: unconfirmed,
      unconfirmed_btc: unconfirmed / 100000000,
      source: "Blockstream",
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(502).json({ error: "Unable to verify treasury balance" });
  }
});

app.listen(PORT, () => {
  console.log(`Goats Empire listening on port ${PORT}`);
});
