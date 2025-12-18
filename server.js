import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

/* ==========================================================
   SPARE PART: REGISTER, UPDATE, DELETE, GET ALL
========================================================== */

// 1. GET ALL PARTS (Kugira ngo ubashe kubihitamo muri Select Box)
app.get("/sparepart", (req, res) => {
  const sql = "SELECT * FROM sparepart ORDER BY Name ASC";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// 2. ADD NEW PART
app.post("/sparepart", (req, res) => {
  const { name, category, quantity, unitPrice } = req.body;
  const sql = "INSERT INTO sparepart (Name, Category, Quantity, UnitPrice) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, category, quantity, unitPrice], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Saved successfully" });
  });
});

// 3. UPDATE PART
app.put("/sparepart/:id", (req, res) => {
  const { id } = req.params;
  const { Name, Quantity, UnitPrice } = req.body;
  const sql = "UPDATE sparepart SET Name = ?, Quantity = ?, UnitPrice = ? WHERE PartID = ?";
  db.query(sql, [Name, Quantity, UnitPrice, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Updated successfully" });
  });
});

// 4. DELETE PART
app.delete("/sparepart/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM sparepart WHERE PartID = ?";
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Deleted successfully" });
  });
});

/* ==========================================================
   INVENTORY MOVEMENTS & RETRIEVAL (STOCK IN / OUT)
========================================================== */

// STOCK IN: Save and Update Quantity
app.post("/stockin", (req, res) => {
  const { PartID, StockInQuantity, StockInDate } = req.body;
  const sql = "INSERT INTO stockin (PartID, StockInQuantity, StockInDate) VALUES (?, ?, ?)";
  db.query(sql, [PartID, StockInQuantity, StockInDate], (err) => {
    if (err) return res.status(500).json(err);
    db.query("UPDATE sparepart SET Quantity = Quantity + ? WHERE PartID = ?", [StockInQuantity, PartID]);
    res.json({ message: "Stock In updated" });
  });
});

// GET STOCK IN HISTORY (Kugira ngo bigaragare kuri dashboard)
app.get("/get-stockin", (req, res) => {
  const sql = `SELECT si.*, s.Name FROM stockin si 
               JOIN sparepart s ON si.PartID = s.PartID 
               ORDER BY si.StockInDate DESC LIMIT 10`;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// STOCK OUT: Save and Update Quantity
app.post("/stockout", (req, res) => {
  const { PartID, StockOutQuantity, StockOutUnitPrice, StockOutTotalPrice, StockOutDate } = req.body;
  const sql = "INSERT INTO stockout (PartID, StockOutQuantity, StockOutUnitPrice, StockOutTotalPrice, StockOutDate) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [PartID, StockOutQuantity, StockOutUnitPrice, StockOutTotalPrice, StockOutDate], (err) => {
    if (err) return res.status(500).json(err);
    db.query("UPDATE sparepart SET Quantity = Quantity - ? WHERE PartID = ?", [StockOutQuantity, PartID]);
    res.json({ message: "Stock Out updated" });
  });
});

// GET STOCK OUT HISTORY (Kugira ngo bigaragare kuri dashboard)
app.get("/get-stockout", (req, res) => {
  const sql = `SELECT so.*, s.Name FROM stockout so 
               JOIN sparepart s ON so.PartID = s.PartID 
               ORDER BY so.StockOutDate DESC LIMIT 10`;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/* ==========================================================
   REPORTS (FULL DATA)
========================================================== */
app.get("/reports", (req, res) => {
  const sql = "SELECT PartID, Name, Quantity, UnitPrice FROM sparepart ORDER BY Name ASC";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});
//delete 
// 1. DELETE STOCK IN (And decrease actual stock)
app.delete("/stockin/:id/:partId/:qty", (req, res) => {
  const { id, partId, qty } = req.params;
  const sql = "DELETE FROM stockin WHERE StockInID = ?";
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json(err);
    // Gabanya stock kuko ibyinjiye bisibwe
    db.query("UPDATE sparepart SET Quantity = Quantity - ? WHERE PartID = ?", [qty, partId]);
    res.json({ message: "Stock In Deleted and Stock Reverted" });
  });
});

// 2. DELETE STOCK OUT (And increase actual stock)
app.delete("/stockout/:id/:partId/:qty", (req, res) => {
  const { id, partId, qty } = req.params;
  const sql = "DELETE FROM stockout WHERE StockOutID = ?";
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json(err);
    // Ongera stock kuko ibyasohotse bisibwe
    db.query("UPDATE sparepart SET Quantity = Quantity + ? WHERE PartID = ?", [qty, partId]);
    res.json({ message: "Stock Out Deleted and Stock Reverted" });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});