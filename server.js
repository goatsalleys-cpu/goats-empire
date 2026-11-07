import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TREASURY_ADDRESS =
  process.env.TREASURY_ADDRESS ||
  "1NxwbpbeS8Twp8G96CbcYNGuz5vxedyzMD";

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    application: "Goats Empire",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/treasury", async (req, res) => {
  try {
    const url =
      `https://blockstream.info/api/address/${TREASURY_ADDRESS}`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({
        error: "Bitcoin data provider unavailable"
      });
    }

    const data = await response.json();

    const confirmedSats =
      data.chain_stats.funded_txo_sum -
      data.chain_stats.spent_txo_sum;

    const unconfirmedSats =
      data.mempool_stats.funded_txo_sum -
      data.mempool_stats.spent_txo_sum;

    res.set("Cache-Control", "no-store");

    res.json({
      network: "Bitcoin Mainnet",
      address: TREASURY_ADDRESS,
      confirmed_satoshis: confirmedSats,
      confirmed_btc: confirmedSats / 100000000,
      unconfirmed_satoshis: unconfirmedSats,
      unconfirmed_btc: unconfirmedSats / 100000000,
      checked_at: new Date().toISOString(),
      source: url
    });
  } catch (error) {
    console.error("Treasury verification failed:", error.message);

    res.status(500).json({
      error: "Unable to verify treasury balance"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Goats Empire listening on port ${PORT}`);
});
