import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",       // shyiramo password ya MySQL niba ihari
  database: "sims_db" // izina rya database yawe
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    return;
  }
  console.log("✅ MySQL Connected");
});

export default db;
