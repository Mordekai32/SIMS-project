import React, { useState, useEffect, type ReactNode } from "react";
import * as XLSX from "xlsx";

/* ==========================================================
   MAIN APP COMPONENT
   ========================================================== */
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [page, setPage] = useState<string>("Reports");

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div style={appContainer}>
      <aside style={sidebarStyle}>
        <div style={logoSection}>
          <div style={logoCircle}>S</div>
          <div>
            <h2 style={{ color: "white", margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>SIMS PRO</h2>
            <span style={{ color: "#bfdbfe", fontSize: '0.7rem' }}>Inventory Control</span>
          </div>
        </div>
        
        <nav style={navStyle}>
          {[
            { id: "Reports", label: "Dashboard", icon: "📊" },
            { id: "SparePart", label: "Add New Part", icon: "📦" },
            { id: "StockIn", label: "Stock In", icon: "📥" },
            { id: "StockOut", label: "Stock Out", icon: "📤" }
          ].map((item) => (
            <button
              key={item.id}
              style={{
                ...navBtnLink,
                background: page === item.id ? "rgba(255,255,255,0.2)" : "transparent",
                borderLeft: page === item.id ? "4px solid white" : "4px solid transparent",
              }}
              onClick={() => setPage(item.id)}
            >
              <span style={{ marginRight: '12px' }}>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <div style={sidebarFooter}>
            <button onClick={() => setIsLoggedIn(false)} style={logoutSidebarBtn}>Logout</button>
            <div style={{ marginTop: '10px', fontSize: '0.7rem', color: '#bfdbfe' }}>MORD TECH v6.0</div>
        </div>
      </aside>

      <main style={mainContentArea}>
        <header style={headerStyle}>
          <div>
            <h3 style={{ color: "#1e3a8a", margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              {page === "Reports" ? "INVENTORY DASHBOARD" : page.toUpperCase()}
            </h3>
          </div>
          <div style={userProfile}>
            <div style={avatarCircle}>M</div>
            <span style={{ color: "#1e40af", fontWeight: 600 }}>Mordekai</span>
          </div>
        </header>

        <div style={{ padding: "35px" }}>
            {page === "Reports" && <Reports />}
            {page === "SparePart" && <SparePart />}
            {page === "StockIn" && <StockIn />}
            {page === "StockOut" && <StockOut />}
        </div>
      </main>
    </div>
  );
}

/* ==========================================================
   REPORTS COMPONENT (DASHBOARD + ALL TABLES)
   ========================================================== */
function Reports() {
  const [rows, setRows] = useState<any[]>([]);
  const [stockInHistory, setStockInHistory] = useState<any[]>([]);
  const [stockOutHistory, setStockOutHistory] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("http://localhost:5000/reports"),
        fetch("http://localhost:5000/get-stockin"),
        fetch("http://localhost:5000/get-stockout")
      ]);
      setRows(await r1.json());
      setStockInHistory(await r2.json());
      setStockOutHistory(await r3.json());
    } catch (e) { console.error("Error fetching data:", e); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalValue = rows.reduce((acc, curr) => acc + (Number(curr.Quantity || 0) * Number(curr.UnitPrice || 0)), 0);
  const lowStockCount = rows.filter(r => Number(r.Quantity) <= 5).length;
  const filteredData = rows.filter(item => (item.Name || "").toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: number) => {
    if (window.confirm("Urashaka gusiba iki gikoresho burundu?")) {
      await fetch(`http://localhost:5000/sparepart/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  const deleteStockIn = async (id: number, partId: number, qty: number) => {
    if (window.confirm("Urashaka gusiba iyi Stock In? Stock izahita igabanuka.")) {
      await fetch(`http://localhost:5000/stockin/${id}/${partId}/${qty}`, { method: "DELETE" });
      fetchData();
    }
  };

  const deleteStockOut = async (id: number, partId: number, qty: number) => {
    if (window.confirm("Urashaka gusiba iyi Stock Out? Stock izahita yisana.")) {
      await fetch(`http://localhost:5000/stockout/${id}/${partId}/${qty}`, { method: "DELETE" });
      fetchData();
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`http://localhost:5000/sparepart/${editingItem.PartID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Name: editingItem.Name,
        Quantity: editingItem.Quantity,
        UnitPrice: editingItem.UnitPrice
      }),
    });
    setEditingItem(null);
    fetchData();
    alert("Byahinduwe neza!");
  };

  return (
    <div>
      <div style={statsGrid}>
        <div style={{ ...statCard, borderLeft: '5px solid #2563eb' }}>
          <small style={statLabel}>TOTAL INVENTORY VALUE</small>
          <h2 style={statValue}>{totalValue.toLocaleString()} RWF</h2>
        </div>
        <div style={{ ...statCard, borderLeft: '5px solid #059669' }}>
          <small style={statLabel}>ACTIVE ITEMS</small>
          <h2 style={statValue}>{rows.length} Parts</h2>
        </div>
        <div style={{ ...statCard, borderLeft: '5px solid #dc2626', background: lowStockCount > 0 ? '#fff1f2' : 'white' }}>
          <small style={statLabel}>LOW STOCK ALERTS</small>
          <h2 style={{ ...statValue, color: '#dc2626' }}>{lowStockCount} Issues</h2>
        </div>
      </div>

      <Card title="Current Stock Inventory">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <input style={searchBar} placeholder="🔍 Search parts..." onChange={(e) => setSearch(e.target.value)} />
          <button style={excelBtn} onClick={() => {
            const ws = XLSX.utils.json_to_sheet(filteredData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Inventory");
            XLSX.writeFile(wb, "Inventory_Report.xlsx");
          }}>📥 Export Full Report</button>
        </div>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={thStyle}>Part Name</th>
              <th style={thStyle}>Stock</th>
              <th style={thStyle}>Unit Price</th>
              <th style={thStyle}>Sub-Total</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((r) => (
              <tr key={r.PartID} style={tableRowStyle}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{r.Name || "N/A"}</td>
                <td style={tdStyle}>{r.Quantity || 0}</td>
                <td style={tdStyle}>{Number(r.UnitPrice || 0).toLocaleString()}</td>
                <td style={{ ...tdStyle, color: '#2563eb', fontWeight: 600 }}>
                    {(Number(r.Quantity || 0) * Number(r.UnitPrice || 0)).toLocaleString()}
                </td>
                <td style={tdStyle}>
                  <span style={Number(r.Quantity) > 5 ? badgeSuccess : badgeDanger}>
                    {Number(r.Quantity) > 5 ? '● STABLE' : '● REORDER'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button style={editActionBtn} onClick={() => setEditingItem(r)}>✏️</button>
                  <button style={deleteActionBtn} onClick={() => handleDelete(r.PartID)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ height: '30px' }}></div>

      <div style={grid2}>
          <Card title="Latest Stock In History">
            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                <table style={tableStyle}>
                    <thead><tr style={{background: '#f8fafc'}}><th style={thStyle}>Date</th><th style={thStyle}>Part</th><th style={thStyle}>Qty</th><th style={thStyle}>Action</th></tr></thead>
                    <tbody>
                        {stockInHistory.map((item, i) => (
                            <tr key={i} style={tableRowStyle}>
                                <td style={tdStyle}><small>{new Date(item.StockInDate).toLocaleDateString()}</small></td>
                                <td style={tdStyle}><b>{item.Name}</b></td>
                                <td style={{...tdStyle, color: '#059669'}}>+{item.StockInQuantity}</td>
                                <td style={tdStyle}>
                                  <button style={deleteActionBtn} onClick={() => deleteStockIn(item.StockInID, item.PartID, item.StockInQuantity)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </Card>

          <Card title="Latest Stock Out History">
            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                <table style={tableStyle}>
                    <thead><tr style={{background: '#f8fafc'}}><th style={thStyle}>Date</th><th style={thStyle}>Part</th><th style={thStyle}>Total</th><th style={thStyle}>Action</th></tr></thead>
                    <tbody>
                        {stockOutHistory.map((item, i) => (
                            <tr key={i} style={tableRowStyle}>
                                <td style={tdStyle}><small>{new Date(item.StockOutDate).toLocaleDateString()}</small></td>
                                <td style={tdStyle}><b>{item.Name}</b></td>
                                <td style={{...tdStyle, color: '#dc2626'}}>{item.StockOutTotalPrice.toLocaleString()}</td>
                                <td style={tdStyle}>
                                  <button style={deleteActionBtn} onClick={() => deleteStockOut(item.StockOutID, item.PartID, item.StockOutQuantity)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </Card>
      </div>

      {editingItem && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#1e3a8a', marginTop: 0 }}>Update Item Details</h3>
            <label style={labelStyle}>Name</label>
            <input style={inputField} value={editingItem.Name} onChange={e => setEditingItem({...editingItem, Name: e.target.value})} />
            <label style={labelStyle}>Quantity</label>
            <input style={inputField} type="number" value={editingItem.Quantity} onChange={e => setEditingItem({...editingItem, Quantity: e.target.value})} />
            <label style={labelStyle}>UnitPrice</label>
            <input style={inputField} type="number" value={editingItem.UnitPrice} onChange={e => setEditingItem({...editingItem, UnitPrice: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button style={primaryBtn} onClick={handleUpdate}>Save Changes</button>
              <button style={{ ...primaryBtn, background: '#64748b' }} onClick={() => setEditingItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================
   FORM COMPONENTS (SparePart, StockIn, StockOut)
   ========================================================== */
function SparePart() {
  const [form, setForm] = useState({ name: "", category: "", quantity: "", unitPrice: "" });
  const save = async () => {
    await fetch("http://localhost:5000/sparepart", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    alert("Kwandika igikoresho gishya byatunganye!");
    setForm({ name: "", category: "", quantity: "", unitPrice: "" });
  };
  return (
    <Card title="Register New Asset">
      <div style={grid2}>
        <div style={inputGroup}><label style={labelStyle}>NAME</label>
            <input style={inputField} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div style={inputGroup}><label style={labelStyle}>CATEGORY</label>
            <input style={inputField} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
      </div>
      <div style={grid2}>
        <div style={inputGroup}><label style={labelStyle}>QUANTITY</label>
            <input style={inputField} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        </div>
        <div style={inputGroup}><label style={labelStyle}>UNIT PRICE</label>
            <input style={inputField} type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
        </div>
      </div>
      <button style={primaryBtn} onClick={save}>Register Item</button>
    </Card>
  );
}

function StockIn() {
  const [parts, setParts] = useState<any[]>([]);
  const [form, setForm] = useState({ partId: "", quantity: "", date: "" });
  useEffect(() => { fetch("http://localhost:5000/sparepart").then(r => r.json()).then(setParts); }, []);

  const save = async () => {
    await fetch("http://localhost:5000/stockin", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ PartID: form.partId, StockInQuantity: form.quantity, StockInDate: form.date }) 
    });
    alert("Stock yongerewe neza!");
  };

  return (
    <Card title="Stock Entry (In)">
      <label style={labelStyle}>SELECT PART</label>
      <select style={inputField} onChange={(e) => setForm({ ...form, partId: e.target.value })}>
          <option value="">-- Choose Item --</option>
          {parts.map(p => <option key={p.PartID} value={p.PartID}>{p.Name} (Available: {p.Quantity})</option>)}
      </select>
      <div style={grid2}>
          <input style={inputField} type="number" placeholder="Qty to Add" onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <input style={inputField} type="date" onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </div>
      <button style={primaryBtn} onClick={save}>Confirm Stock In</button>
    </Card>
  );
}

function StockOut() {
  const [parts, setParts] = useState<any[]>([]);
  const [form, setForm] = useState({ partId: "", quantity: "", unitPrice: "", date: "" });
  useEffect(() => { fetch("http://localhost:5000/sparepart").then(r => r.json()).then(setParts); }, []);

  const total = Number(form.quantity) * Number(form.unitPrice) || 0;
  const save = async () => {
    await fetch("http://localhost:5000/stockout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ PartID: form.partId, StockOutQuantity: form.quantity, StockOutUnitPrice: form.unitPrice, StockOutTotalPrice: total, StockOutDate: form.date })
    });
    alert("Iyasohotse yanditswe neza!");
  };

  return (
    <Card title="Stock Dispatch (Out)">
      <label style={labelStyle}>SELECT PART TO SELL</label>
      <select style={inputField} onChange={(e) => setForm({ ...form, partId: e.target.value })}>
          <option value="">-- Choose Item --</option>
          {parts.map(p => <option key={p.PartID} value={p.PartID} disabled={p.Quantity <= 0}>{p.Name} ({p.Quantity} left)</option>)}
      </select>
      <div style={grid2}>
        <input style={inputField} type="number" placeholder="Qty" onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        <input style={inputField} type="number" placeholder="Price" onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
      </div>
      <div style={infoBox}>Total Transaction: <strong>{total.toLocaleString()} RWF</strong></div>
      <button style={{ ...primaryBtn, background: '#dc2626', width: '100%' }} onClick={save}>Sell Item</button>
    </Card>
  );
}

/* ==========================================================
   LOGIN & HELPERS
   ========================================================== */
function Login({ onLogin }: { onLogin: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  return (
    <div style={loginBg}>
      <div style={loginCard}>
        <div style={loginIcon}>S</div>
        <h2 style={{ color: '#1e3a8a' }}>SIMS V6.0 Login</h2>
        <input style={inputField} placeholder="Username" onChange={e => setU(e.target.value)} />
        <input style={inputField} type="password" placeholder="Password" onChange={e => setP(e.target.value)} />
        <button style={{ ...primaryBtn, width: '100%' }} onClick={() => (u === "Mordekai" && p === "12345") ? onLogin() : alert("Wrong!")}>Login</button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode; }) {
  return (
    <div style={cardStyle}>
      <div style={cardHeader}>{title}</div>
      <div style={{ padding: '25px' }}>{children}</div>
    </div>
  );
}

// STYLING
const appContainer: React.CSSProperties = { display: "flex", minHeight: "100vh", background: "#f8fafc" };
const sidebarStyle: React.CSSProperties = { width: "260px", background: "#1e3a8a", color: "white", position: "fixed", height: "100vh" };
const logoSection: React.CSSProperties = { padding: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: 'flex', gap: '10px' };
const logoCircle: React.CSSProperties = { width: '35px', height: '35px', background: 'white', borderRadius: '8px', color: '#1e3a8a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 900 };
const navStyle: React.CSSProperties = { padding: "20px 10px" };
const navBtnLink: React.CSSProperties = { display: "block", width: "100%", padding: "14px", marginBottom: "8px", border: "none", borderRadius: "10px", cursor: "pointer", textAlign: "left", color: 'white' };
const mainContentArea: React.CSSProperties = { marginLeft: "260px", width: "calc(100% - 260px)" };
const headerStyle: React.CSSProperties = { background: "white", padding: "20px 40px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0" };
const userProfile: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px' };
const avatarCircle: React.CSSProperties = { width: '35px', height: '35px', background: '#dbeafe', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' };
const statCard: React.CSSProperties = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const statLabel: React.CSSProperties = { color: '#64748b', fontSize: '0.7rem', fontWeight: 700 };
const statValue: React.CSSProperties = { margin: '5px 0', color: '#1e3a8a' };
const inputField: React.CSSProperties = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: '15px', boxSizing: 'border-box' };
const primaryBtn: React.CSSProperties = { background: "#2563eb", color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: 700 };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const thStyle: React.CSSProperties = { padding: "15px", textAlign: "left", fontSize: '0.75rem', color: '#64748b' };
const tdStyle: React.CSSProperties = { padding: "15px", borderBottom: '1px solid #f1f5f9' };
const badgeSuccess: React.CSSProperties = { background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '10px', fontSize: '0.7rem' };
const badgeDanger: React.CSSProperties = { background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '10px', fontSize: '0.7rem' };
const editActionBtn: React.CSSProperties = { background: '#eff6ff', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' };
const deleteActionBtn: React.CSSProperties = { background: '#fff1f2', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent: React.CSSProperties = { background: 'white', padding: '30px', borderRadius: '15px', width: '350px' };
const cardStyle: React.CSSProperties = { background: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: '20px' };
const cardHeader: React.CSSProperties = { padding: '15px 25px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#1e3a8a' };
const searchBar: React.CSSProperties = { padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", width: "200px" };
const excelBtn: React.CSSProperties = { background: "#059669", color: "white", border: "none", padding: "10px 15px", borderRadius: "8px", cursor: "pointer" };
const loginBg: React.CSSProperties = { height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#dbeafe' };
const loginCard: React.CSSProperties = { background: 'white', padding: '40px', borderRadius: '20px', width: '300px', textAlign: 'center' };
const loginIcon: React.CSSProperties = { width: '50px', height: '50px', background: '#1e3a8a', color: 'white', borderRadius: '10px', margin: '0 auto 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', fontWeight: 900 };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };
const inputGroup: React.CSSProperties = { marginBottom: "10px" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#475569", marginBottom: '5px' };
const infoBox: React.CSSProperties = { background: "#f8fafc", padding: "10px", borderRadius: "8px", marginBottom: "15px", textAlign: "right", fontSize: '0.9rem' };
const sidebarFooter: React.CSSProperties = { padding: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" };
const logoutSidebarBtn: React.CSSProperties = { background: '#dc2626', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', width: '100%' };
const tableRowStyle: React.CSSProperties = { borderBottom: '1px solid #f1f5f9' };