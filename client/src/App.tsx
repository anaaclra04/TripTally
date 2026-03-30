import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

interface Member      { id: string; name: string; }
interface Expense     { id: string; description: string; amount: number; paid_by: string; }
interface Group       { id: string; name: string; color: string; members: Member[]; expenses: Expense[]; }
interface Transaction { from: string; to: string; amount: string; }

const fmt = (n: number | string) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

const totalSpend = (g: Group) =>
  g.expenses.reduce((s, e) => s + Number(e.amount), 0);

const allTimeSpend = (groups: Group[]) =>
  groups.reduce((s, g) => s + totalSpend(g), 0);

const PALETTE = [
  "#2563eb","#7c3aed","#db2777","#dc2626",
  "#ea580c","#ca8a04","#16a34a","#0891b2",
];
const memberColor = (name: string) => PALETTE[name.charCodeAt(0) % PALETTE.length];
const initials = (name: string) =>
  name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,300&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #f6f8fc;
    color: #0f172a;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  input, select, button { font-family: inherit; }
  input::placeholder { color: #8da4c0; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d0daea; border-radius: 99px; }

  /* ── Inputs ── */
  .tt-input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 14px;
    background: #fafbfd;
    border: 1.5px solid #d0daea;
    color: #0f172a;
    font-size: 14px;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .tt-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
  }
  .tt-select {
    width: 100%;
    padding: 12px 36px 12px 16px;
    border-radius: 14px;
    background: #fafbfd;
    border: 1.5px solid #d0daea;
    color: #0f172a;
    font-size: 14px;
    outline: none;
    appearance: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a07850' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    transition: border-color .15s;
  }
  .tt-select:focus { border-color: #2563eb; }

  /* ── Buttons ── */
  .btn-primary {
    padding: 12px 22px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    white-space: nowrap;
    transition: background .15s, transform .1s, box-shadow .15s;
    box-shadow: 0 4px 16px rgba(37,99,235,.22);
    font-family: 'DM Sans', sans-serif;
    letter-spacing: -.1px;
  }
  .btn-primary:hover  { background: #1d4ed8; box-shadow: 0 6px 20px rgba(37,99,235,.30); }
  .btn-primary:active { transform: scale(.97); }

  .btn-secondary {
    padding: 11px 18px;
    background: #fafbfd;
    color: #2d4a6e;
    border: 1.5px solid #d0daea;
    border-radius: 14px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: background .12s, border-color .12s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-secondary:hover { background: #eef2fa; border-color: #a8b8d0; }

  .btn-danger {
    padding: 8px 14px;
    background: #fff5f5;
    color: #c0392b;
    border: 1.5px solid #fdd;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background .12s, transform .1s;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }
  .btn-danger:hover  { background: #ffe8e8; }
  .btn-danger:active { transform: scale(.96); }

  /* ── Cards ── */
  .card {
    background: #fafbfd;
    border: 1px solid #dce4f0;
    border-radius: 22px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(30,60,120,.05);
  }

  .group-card {
    background: #fafbfd;
    border: 1.5px solid #dce4f0;
    border-radius: 20px;
    padding: 20px 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(30,60,120,.05);
    transition: border-color .18s, box-shadow .18s, transform .16s, background .14s;
    position: relative;
    overflow: hidden;
  }
  .group-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(235,242,255,.6) 0%, transparent 60%);
    opacity: 0;
    transition: opacity .2s;
  }
  .group-card:hover {
    border-color: #4a7ab5;
    box-shadow: 0 8px 28px rgba(30,60,120,.10);
    transform: translateY(-2px);
    background: #f8fafd;
  }
  .group-card:hover::before { opacity: 1; }
  .group-card:active { transform: translateY(0px); }

  /* ── Avatars ── */
  .avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800;
    flex-shrink: 0;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    border: 2px solid #f6f8fc;
  }
  .avatar-lg {
    width: 42px; height: 42px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 800;
    flex-shrink: 0;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
  }
  .avatar-icon {
    width: 50px; height: 50px;
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800;
    flex-shrink: 0;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,.15);
  }

  /* ── Chips ── */
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px 5px 6px;
    border-radius: 999px;
    background: #eef2fa;
    border: 1px solid #dce4f0;
    color: #2d4a6e;
    font-size: 13px;
    font-weight: 500;
    margin: 0 6px 7px 0;
    transition: border-color .12s;
  }
  .chip:hover { border-color: #a8b8d0; }
  .chip-x {
    border: none; background: none;
    color: #8da4c0; cursor: pointer;
    font-size: 13px; padding: 0; line-height: 1;
    transition: color .1s;
  }
  .chip-x:hover { color: #c0392b; }

  /* ── Rows ── */
  .expense-row {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 0;
    border-bottom: 1px solid #edf1f8;
    transition: background .1s;
  }
  .expense-row:last-child { border-bottom: none; }

  .settle-row {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #edf1f8;
  }
  .settle-row:last-child { border-bottom: none; }

  /* ── Labels ── */
  .eyebrow {
    font-size: 10px; font-weight: 700;
    letter-spacing: 1.8px; text-transform: uppercase;
    color: #6b86a8; margin-bottom: 14px;
  }

  /* ── Stat card ── */
  .stat-card {
    background: #fafbfd;
    border: 1px solid #dce4f0;
    border-radius: 18px;
    padding: 18px 20px;
    flex: 1;
    box-shadow: 0 2px 8px rgba(30,60,120,.04);
  }

  /* ── Hero ── */
  .hero {
    background: linear-gradient(135deg, #1e3a6e 0%, #1d4ed8 40%, #2563eb 100%);
    border-radius: 28px;
    padding: 36px 40px;
    color: #fff;
    margin-bottom: 36px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(37,99,235,.18);
  }
  .hero::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 240px; height: 240px;
    border-radius: 50%;
    background: rgba(255,255,255,.07);
  }
  .hero::after {
    content: '';
    position: absolute;
    bottom: -60px; right: 80px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(255,255,255,.05);
  }

  /* ── Toast / Error ── */
  .toast {
    position: fixed; bottom: 24px; left: 50%;
    transform: translateX(-50%);
    background: #0f172a;
    color: #93c5fd;
    padding: 11px 24px; border-radius: 999px;
    font-size: 13px; font-weight: 700;
    z-index: 9999; white-space: nowrap;
    box-shadow: 0 8px 32px rgba(0,0,0,.2);
    animation: fadeUp .18s ease;
  }
  .error-bar {
    background: #fff5f5; border: 1px solid #fdd;
    border-radius: 14px; padding: 12px 18px;
    margin-bottom: 20px; font-size: 13px; color: #c0392b;
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
  }

  /* ── Animations ── */
  .fade-in { animation: fadeIn .24s ease; }
  @keyframes fadeIn  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

  .mono { font-family: 'DM Mono', monospace; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .group-grid { grid-template-columns: 1fr !important; }
    .two-col    { grid-template-columns: 1fr !important; }
    .exp-form   { grid-template-columns: 1fr !important; }
    .stats-row  { flex-wrap: wrap; }
    .hero       { padding: 26px 24px; }
  }
`;

export default function App() {
  const [groups,        setGroups]        = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupName,     setGroupName]     = useState("");
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [memberName,    setMemberName]    = useState("");
  const [expenseDesc,   setExpenseDesc]   = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [paidBy,        setPaidBy]        = useState("");
  const [transactions,  setTransactions]  = useState<Transaction[]>([]);
  const [error,         setError]         = useState<string | null>(null);
  const [toast,         setToast]         = useState<string | null>(null);
  const [balancesOpen,  setBalancesOpen]  = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const fetchGroups = async () => {
    try {
      const res = await axios.get<Group[]>(`${API}/groups`);
      setGroups(res.data); return res.data;
    } catch { setError("Cannot reach server. Is the backend running?"); return null; }
  };

  const refreshAndSync = async (groupId?: string) => {
    const updated = await fetchGroups();
    if (!updated) return;
    const id = groupId ?? selectedGroup?.id;
    if (id) setSelectedGroup(updated.find(g => g.id === id) ?? null);
  };

  useEffect(() => { fetchGroups(); }, []);

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const res = await axios.post<Group>(`${API}/groups`, { name: groupName.trim(), color: selectedColor });
      setGroupName("");
      setSelectedColor(PALETTE[0]);
      await refreshAndSync(res.data.id); showToast(`"${res.data.name}" created`);
    } catch { setError("Failed to create group."); }
  };

  const deleteGroup = async (id: string) => {
    try {
      await axios.delete(`${API}/groups/${id}`);
      setSelectedGroup(null); setTransactions([]); setBalancesOpen(false);
      await fetchGroups(); showToast("Group deleted");
    } catch { setError("Failed to delete group."); }
  };

  const getGroupColor = (g: Group) => g.color ?? PALETTE[0];

  const addMember = async (groupId: string) => {
    if (!memberName.trim()) return;
    try {
      await axios.post(`${API}/groups/${groupId}/members`, { name: memberName.trim() });
      setMemberName(""); await refreshAndSync(groupId); showToast("Member added");
    } catch { setError("Failed to add member."); }
  };

  const removeMember = async (groupId: string, memberId: string) => {
    try {
      await axios.delete(`${API}/groups/${groupId}/members/${memberId}`);
      await refreshAndSync(groupId);
    } catch { setError("Failed to remove member."); }
  };

  const addExpense = async (groupId: string) => {
    if (!expenseDesc.trim() || !expenseAmount || !paidBy) return;
    try {
      await axios.post(`${API}/groups/${groupId}/expenses`, {
        description: expenseDesc.trim(), amount: parseFloat(expenseAmount), paid_by: paidBy,
      });
      setExpenseDesc(""); setExpenseAmount(""); setPaidBy("");
      await refreshAndSync(groupId); showToast("Expense added");
    } catch { setError("Failed to add expense."); }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      await axios.delete(`${API}/expenses/${expenseId}`);
      await refreshAndSync(); showToast("Expense removed");
    } catch { setError("Failed to delete expense."); }
  };

  const calculateBalances = async (groupId: string) => {
    try {
      const res = await axios.get<{ transactions: Transaction[] }>(`${API}/groups/${groupId}/balances`);
      setTransactions(res.data.transactions); setBalancesOpen(true);
    } catch { setError("Failed to calculate balances."); }
  };

  const goHome = () => { setSelectedGroup(null); setTransactions([]); setBalancesOpen(false); };

  const totalGroups   = groups.length;
  const totalExpenses = groups.reduce((s, g) => s + g.expenses.length, 0);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {toast && <div className="toast">✦ {toast}</div>}

      <div style={{ minHeight: "100vh", padding: "40px 32px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* ── Top nav ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "36px" }}>
          <button
            onClick={goHome}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
          >
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", color: "#0f172a" }}>
              Trip<span style={{ color: "#2563eb" }}>Tally</span>
            </div>
            <div className="mono" style={{ fontSize: "11px", color: "#8da4c0", marginTop: "2px" }}>
              split smarter, travel lighter
            </div>
          </button>

          {selectedGroup && (
            <button className="btn-secondary" onClick={goHome}>← All Groups</button>
          )}
        </div>

        {error && (
          <div className="error-bar">
            <span>⚠ {error}</span>
            <button className="btn-secondary" style={{ padding: "5px 10px", fontSize: "12px" }} onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* ══ HOME ══ */}
        {!selectedGroup && (
          <div className="fade-in">

            {/* Hero */}
            <div className="hero">
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: "13px", fontWeight: 300, letterSpacing: "2px", textTransform: "uppercase", opacity: .75, marginBottom: "10px" }}>
                  Your Trips
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: "52px", fontWeight: 700, lineHeight: 1, letterSpacing: "-1.5px", marginBottom: "6px" }}>
                  {fmt(allTimeSpend(groups))}
                </div>
                <div style={{ fontSize: "14px", opacity: .75, fontWeight: 500, marginBottom: "28px" }}>
                  across {totalGroups} group{totalGroups !== 1 ? "s" : ""} · {totalExpenses} expense{totalExpenses !== 1 ? "s" : ""}
                </div>

                {/* Inline create */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "520px" }}>
                  {/* Color swatches */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", opacity: .7, fontWeight: 600, letterSpacing: ".5px", marginRight: "2px" }}>Color</span>
                    {PALETTE.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          width: "26px", height: "26px", borderRadius: "50%",
                          background: color, border: "none", cursor: "pointer",
                          flexShrink: 0,
                          outline: selectedColor === color ? "3px solid #fff" : "3px solid transparent",
                          outlineOffset: "2px",
                          transform: selectedColor === color ? "scale(1.15)" : "scale(1)",
                          transition: "transform .12s, outline .12s",
                          boxShadow: "0 2px 6px rgba(0,0,0,.2)",
                        }}
                      />
                    ))}
                  </div>
                  {/* Name input + button */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    {/* Live preview avatar */}
                    <div style={{
                      width: "46px", height: "46px", borderRadius: "14px",
                      background: selectedColor, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px", fontWeight: 800, color: "#fff",
                      boxShadow: "0 4px 12px rgba(0,0,0,.2)",
                      transition: "background .2s",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {groupName ? initials(groupName) : "?"}
                    </div>
                    <input
                      className="tt-input"
                      placeholder="New trip name… e.g. Europe Summer"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && createGroup()}
                      style={{ flex: 1, background: "rgba(255,255,255,.92)", border: "1.5px solid rgba(255,255,255,.4)" }}
                    />
                    <button
                      onClick={createGroup}
                      style={{
                        padding: "12px 22px", background: "#fff", color: "#2563eb",
                        border: "none", borderRadius: "14px", fontWeight: 800,
                        fontSize: "14px", cursor: "pointer", whiteSpace: "nowrap",
                        boxShadow: "0 4px 16px rgba(0,0,0,.12)", transition: "transform .1s, box-shadow .15s",
                      }}
                      onMouseOver={e => (e.currentTarget.style.transform = "scale(1.02)")}
                      onMouseOut={e  => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      + Create Group
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Group grid */}
            {groups.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: "22px", fontWeight: 600, color: "#8da4c0", marginBottom: "8px" }}>
                  No trips yet
                </div>
                <div className="mono" style={{ fontSize: "13px", color: "#a8bcd4" }}>
                  Create your first group above to get started.
                </div>
              </div>
            ) : (
              <>
                <div className="eyebrow" style={{ marginBottom: "16px" }}>Your Groups</div>
                <div className="group-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                  {groups.map(g => (
                    <div
                      key={g.id}
                      className="group-card"
                      onClick={() => { setSelectedGroup(g); setTransactions([]); setBalancesOpen(false); }}
                    >
                      <div className="avatar-icon" style={{ background: getGroupColor(g) }}>
                        {initials(g.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "17px", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {g.name}
                        </div>
                        <div className="mono" style={{ fontSize: "12px", color: "#6b86a8" }}>
                          {g.members.length} member{g.members.length !== 1 ? "s" : ""} · {g.expenses.length} expense{g.expenses.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div className="mono" style={{ fontWeight: 700, fontSize: "16px", color: "#2563eb" }}>{fmt(totalSpend(g))}</div>
                        <div className="mono" style={{ fontSize: "10px", color: "#8da4c0", marginTop: "2px" }}>total</div>
                      </div>
                      <div style={{ color: "#d0daea", fontSize: "20px" }}>›</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ GROUP DETAIL ══ */}
        {selectedGroup && (
          <div className="fade-in">

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <div style={{
                    width: "12px", height: "12px", borderRadius: "50%",
                    background: getGroupColor(selectedGroup),
                    boxShadow: `0 0 0 3px ${getGroupColor(selectedGroup)}33`,
                  }} />
                  <div className="mono" style={{ fontSize: "11px", color: "#6b86a8", letterSpacing: "1px", textTransform: "uppercase" }}>
                    Trip
                  </div>
                </div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "40px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "10px", lineHeight: 1 }}>
                  {selectedGroup.name}
                </h1>
                <div style={{ display: "flex", gap: "4px" }}>
                  {selectedGroup.members.slice(0, 9).map(m => (
                    <div key={m.id} className="avatar" style={{ background: memberColor(m.name) }} title={m.name}>
                      {initials(m.name)}
                    </div>
                  ))}
                  {selectedGroup.members.length > 9 && (
                    <span className="mono" style={{ fontSize: "12px", color: "#6b86a8", alignSelf: "center", marginLeft: "4px" }}>
                      +{selectedGroup.members.length - 9}
                    </span>
                  )}
                </div>
              </div>
              <button className="btn-danger" style={{ padding: "10px 18px", marginTop: "8px" }} onClick={() => deleteGroup(selectedGroup.id)}>
                Delete Group
              </button>
            </div>

            {/* Stats */}
            <div className="stats-row" style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Total Spent",  val: fmt(totalSpend(selectedGroup)),  accent: true },
                { label: "Members",      val: String(selectedGroup.members.length) },
                { label: "Expenses",     val: String(selectedGroup.expenses.length) },
                { label: "Per Person",   val: selectedGroup.members.length > 0 ? fmt(totalSpend(selectedGroup) / selectedGroup.members.length) : fmt(0) },
              ].map(s => (
                <div key={s.label} className="stat-card" style={s.accent ? { borderColor: "#4a7ab5", background: "#f4f7fd" } : {}}>
                  <div className="eyebrow" style={{ marginBottom: "6px" }}>{s.label}</div>
                  <div className="mono" style={{ fontSize: "22px", fontWeight: 700, color: s.accent ? "#2563eb" : "#0f172a" }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Members + Settle up */}
            <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>

              <div className="card">
                <div className="eyebrow">Members</div>
                <div style={{ marginBottom: "16px", minHeight: "30px" }}>
                  {selectedGroup.members.length === 0
                    ? <p className="mono" style={{ fontSize: "12px", color: "#8da4c0" }}>No members yet.</p>
                    : selectedGroup.members.map(m => (
                        <span key={m.id} className="chip">
                          <div className="avatar" style={{ background: memberColor(m.name), width: "20px", height: "20px", fontSize: "9px", border: "none" }}>
                            {initials(m.name)}
                          </div>
                          {m.name}
                          <button className="chip-x" onClick={() => removeMember(selectedGroup.id, m.id)}>✕</button>
                        </span>
                      ))
                  }
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    className="tt-input"
                    placeholder="Add member…"
                    value={memberName}
                    onChange={e => setMemberName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addMember(selectedGroup.id)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn-primary" onClick={() => addMember(selectedGroup.id)}>Add</button>
                </div>
              </div>

              <div className="card">
                <div className="eyebrow">Settle Up</div>
                <button className="btn-primary" style={{ width: "100%", marginBottom: "14px" }} onClick={() => calculateBalances(selectedGroup.id)}>
                  Calculate Balances
                </button>
                {!balancesOpen
                  ? <p className="mono" style={{ fontSize: "12px", color: "#8da4c0" }}>Hit calculate to see who owes what.</p>
                  : transactions.length === 0
                    ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0" }}>
                        <span style={{ fontSize: "18px" }}>🎉</span>
                        <p className="mono" style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>Everyone is settled up!</p>
                      </div>
                    )
                    : transactions.map((t, i) => (
                        <div key={i} className="settle-row">
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="avatar-lg" style={{ background: memberColor(t.from) }}>{initials(t.from)}</div>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{t.from}</div>
                              <div className="mono" style={{ fontSize: "11px", color: "#6b86a8" }}>owes {t.to}</div>
                            </div>
                          </div>
                          <div className="mono" style={{ fontSize: "17px", fontWeight: 700, color: "#2563eb" }}>{fmt(t.amount)}</div>
                        </div>
                      ))
                }
              </div>
            </div>

            {/* Expenses */}
            <div className="card">
              <div className="eyebrow">Expenses</div>

              {selectedGroup.expenses.length === 0
                ? <p className="mono" style={{ fontSize: "12px", color: "#8da4c0", marginBottom: "20px" }}>No expenses yet — add one below.</p>
                : (
                  <div style={{ marginBottom: "22px" }}>
                    {selectedGroup.expenses.map(exp => (
                      <div key={exp.id} className="expense-row">
                        <div className="avatar-lg" style={{ background: memberColor(exp.paid_by) }}>{initials(exp.paid_by)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", marginBottom: "2px" }}>{exp.description}</div>
                          <div className="mono" style={{ fontSize: "11px", color: "#6b86a8" }}>paid by {exp.paid_by}</div>
                        </div>
                        <div className="mono" style={{ fontSize: "16px", fontWeight: 700, color: "#2563eb", marginRight: "14px" }}>
                          {fmt(exp.amount)}
                        </div>
                        <button className="btn-danger" onClick={() => deleteExpense(exp.id)}>Delete</button>
                      </div>
                    ))}
                  </div>
                )
              }

              {/* Add expense form */}
              <div style={{ background: "#eef2fa", border: "1.5px solid #dce4f0", borderRadius: "16px", padding: "18px" }}>
                <div className="eyebrow">Add Expense</div>
                <div className="exp-form" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "8px", alignItems: "end" }}>
                  <input className="tt-input" placeholder="Description" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} />
                  <input className="tt-input mono" type="number" placeholder="Amount" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} />
                  <select className="tt-select" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                    <option value="">Who paid?</option>
                    {selectedGroup.members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                  <button className="btn-primary" onClick={() => addExpense(selectedGroup.id)}>Add</button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}