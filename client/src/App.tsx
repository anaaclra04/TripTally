import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

interface Member      { id: string; name: string; }
interface Expense     { id: string; description: string; amount: number; paid_by: string; }
interface Group       { id: string; name: string; members: Member[]; expenses: Expense[]; }
interface Transaction { from: string; to: string; amount: string; }

const fmt = (n: number | string) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

const totalSpend = (g: Group) =>
  g.expenses.reduce((s, e) => s + Number(e.amount), 0);

const COLORS = ["#f97316","#22d3ee","#a78bfa","#34d399","#fb7185","#fbbf24","#60a5fa","#e879f9"];
const memberColor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (name: string) =>
  name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #f0f4ff;
    color: #0f172a;
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
  }

  input, select, button { font-family: inherit; }
  input::placeholder, textarea::placeholder { color: #94a3b8; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

  .tt-input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 12px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    color: #0f172a;
    font-size: 14px;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    font-family: 'Inter', sans-serif;
  }
  .tt-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,.14);
  }

  .tt-select {
    width: 100%;
    padding: 11px 36px 11px 14px;
    border-radius: 12px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    color: #0f172a;
    font-size: 14px;
    outline: none;
    appearance: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    transition: border-color .15s;
  }
  .tt-select:focus { border-color: #3b82f6; }

  .btn-primary {
    padding: 11px 20px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    white-space: nowrap;
    transition: background .15s, transform .1s, box-shadow .15s;
    box-shadow: 0 4px 14px rgba(37,99,235,.22);
    font-family: 'Inter', sans-serif;
  }
  .btn-primary:hover  { background: #1d4ed8; box-shadow: 0 6px 18px rgba(37,99,235,.28); }
  .btn-primary:active { transform: scale(.97); }

  .btn-secondary {
    padding: 10px 16px;
    background: #fff;
    color: #334155;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: background .12s, border-color .12s;
    font-family: 'Inter', sans-serif;
  }
  .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }

  .btn-danger {
    padding: 8px 13px;
    background: #fff1f2;
    color: #dc2626;
    border: 1.5px solid #fecaca;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background .12s;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
  }
  .btn-danger:hover { background: #ffe4e6; }

  .card {
    background: #fff;
    border: 1px solid #e8eef6;
    border-radius: 20px;
    padding: 22px;
    box-shadow: 0 4px 20px rgba(15,23,42,.05);
  }

  .group-card {
    background: #fff;
    border: 1.5px solid #e8eef6;
    border-radius: 18px;
    padding: 18px 20px;
    cursor: pointer;
    transition: border-color .15s, box-shadow .15s, transform .12s;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 2px 8px rgba(15,23,42,.04);
  }
  .group-card:hover {
    border-color: #bfdbfe;
    box-shadow: 0 8px 24px rgba(37,99,235,.1);
    transform: translateY(-1px);
  }
  .group-card.active {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,.12), 0 8px 24px rgba(37,99,235,.1);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 11px 5px 6px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    font-size: 13px;
    margin: 0 6px 6px 0;
  }
  .chip-x {
    border: none;
    background: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 13px;
    padding: 0;
    transition: color .1s;
    line-height: 1;
  }
  .chip-x:hover { color: #ef4444; }

  .avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800;
    flex-shrink: 0;
    color: #fff;
    font-family: 'Syne', sans-serif;
  }
  .avatar-lg {
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800;
    flex-shrink: 0;
    color: #fff;
    font-family: 'Syne', sans-serif;
  }
  .avatar-icon {
    width: 44px; height: 44px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800;
    flex-shrink: 0;
    color: #fff;
    font-family: 'Syne', sans-serif;
  }

  .eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 12px;
  }

  .stat-card {
    background: #fff;
    border: 1px solid #e8eef6;
    border-radius: 16px;
    padding: 16px 18px;
    box-shadow: 0 2px 8px rgba(15,23,42,.04);
    flex: 1;
  }

  .expense-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .expense-row:last-child { border-bottom: none; }

  .settle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .settle-row:last-child { border-bottom: none; }

  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    border: 1px solid #dbeafe;
    color: #1d4ed8;
    padding: 10px 22px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    z-index: 9999;
    box-shadow: 0 8px 30px rgba(15,23,42,.12);
    white-space: nowrap;
    animation: fadeUp .18s ease;
  }

  .error-bar {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 14px;
    padding: 12px 16px;
    margin-bottom: 18px;
    font-size: 13px;
    color: #be123c;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .fade-in { animation: fadeIn .22s ease; }

  @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateX(-50%) translateY(6px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

  .mono { font-family: 'DM Mono', monospace; }

  @media (max-width: 860px) {
    .two-col { grid-template-columns: 1fr !important; }
    .expense-form-grid { grid-template-columns: 1fr !important; }
    .stats-row { flex-wrap: wrap; }
  }
`;

export default function App() {
  const [groups,        setGroups]        = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupName,     setGroupName]     = useState("");
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
    } catch { setError("Cannot reach server."); return null; }
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
      const res = await axios.post<Group>(`${API}/groups`, { name: groupName.trim() });
      setGroupName(""); await refreshAndSync(res.data.id); showToast(`"${res.data.name}" created`);
    } catch { setError("Failed to create group."); }
  };

  const deleteGroup = async (id: string) => {
    try {
      await axios.delete(`${API}/groups/${id}`);
      setSelectedGroup(null); setTransactions([]); setBalancesOpen(false);
      await fetchGroups(); showToast("Group deleted");
    } catch { setError("Failed to delete group."); }
  };

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

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {toast && <div className="toast">✦ {toast}</div>}

      <div style={{ minHeight: "100vh", padding: "36px 24px", maxWidth: "900px", margin: "0 auto" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px" }}>
              Trip<span style={{ color: "#2563eb" }}>Tally</span>
            </div>
            <div className="mono" style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
              split smarter, travel lighter
            </div>
          </div>

          {selectedGroup && (
            <button className="btn-secondary" onClick={() => { setSelectedGroup(null); setTransactions([]); setBalancesOpen(false); }}>
              ← All Groups
            </button>
          )}
        </div>

        {error && (
          <div className="error-bar">
            <span>⚠ {error}</span>
            <button className="btn-secondary" style={{ padding: "5px 10px", fontSize: "12px" }} onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* ══ HOME: group list + create ══ */}
        {!selectedGroup && (
          <div className="fade-in">

            {/* Create group */}
            <div className="card" style={{ marginBottom: "28px" }}>
              <div className="eyebrow">New Group</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  className="tt-input"
                  placeholder="e.g. Spring Break, Europe Trip…"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createGroup()}
                  style={{ flex: 1 }}
                />
                <button className="btn-primary" onClick={createGroup}>Create Group</button>
              </div>
            </div>

            {/* Group list */}
            {groups.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px", color: "#cbd5e1" }}>No groups yet</div>
                <div className="mono" style={{ fontSize: "13px" }}>Create your first group above to get started.</div>
              </div>
            ) : (
              <>
                <div className="eyebrow" style={{ marginBottom: "14px" }}>Your Groups</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {groups.map(g => (
                    <div key={g.id} className="group-card" onClick={() => { setSelectedGroup(g); setTransactions([]); setBalancesOpen(false); }}>
                      <div className="avatar-icon" style={{ background: memberColor(g.name) }}>
                        {initials(g.name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "16px", marginBottom: "3px" }}>{g.name}</div>
                        <div className="mono" style={{ fontSize: "12px", color: "#94a3b8" }}>
                          {g.members.length} member{g.members.length !== 1 ? "s" : ""} · {g.expenses.length} expense{g.expenses.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="mono" style={{ fontWeight: 700, fontSize: "16px", color: "#2563eb" }}>{fmt(totalSpend(g))}</div>
                        <div className="mono" style={{ fontSize: "11px", color: "#94a3b8" }}>total</div>
                      </div>
                      <div style={{ color: "#cbd5e1", fontSize: "18px", marginLeft: "4px" }}>›</div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
              <div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "8px" }}>
                  {selectedGroup.name}
                </h1>
                <div style={{ display: "flex", gap: "5px" }}>
                  {selectedGroup.members.slice(0, 8).map(m => (
                    <div key={m.id} className="avatar" style={{ background: memberColor(m.name) }} title={m.name}>{initials(m.name)}</div>
                  ))}
                  {selectedGroup.members.length > 8 && (
                    <span className="mono" style={{ fontSize: "12px", color: "#94a3b8", alignSelf: "center" }}>+{selectedGroup.members.length - 8}</span>
                  )}
                </div>
              </div>
              <button className="btn-danger" style={{ padding: "9px 16px" }} onClick={() => deleteGroup(selectedGroup.id)}>Delete Group</button>
            </div>

            {/* Stats */}
            <div className="stats-row" style={{ display: "flex", gap: "12px", marginBottom: "18px" }}>
              {[
                { label: "Total Spent",  val: fmt(totalSpend(selectedGroup)) },
                { label: "Members",      val: String(selectedGroup.members.length) },
                { label: "Expenses",     val: String(selectedGroup.expenses.length) },
                { label: "Per Person",   val: selectedGroup.members.length > 0 ? fmt(totalSpend(selectedGroup) / selectedGroup.members.length) : fmt(0) },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="eyebrow" style={{ marginBottom: "6px" }}>{s.label}</div>
                  <div className="mono" style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Members + Settle up */}
            <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>

              <div className="card">
                <div className="eyebrow">Members</div>
                <div style={{ marginBottom: "14px", minHeight: "28px" }}>
                  {selectedGroup.members.length === 0
                    ? <p className="mono" style={{ fontSize: "12px", color: "#94a3b8" }}>No members yet.</p>
                    : selectedGroup.members.map(m => (
                        <span key={m.id} className="chip">
                          <div className="avatar" style={{ background: memberColor(m.name), width: "20px", height: "20px", fontSize: "9px" }}>{initials(m.name)}</div>
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
                  ? <p className="mono" style={{ fontSize: "12px", color: "#94a3b8" }}>Hit calculate to see who owes what.</p>
                  : transactions.length === 0
                    ? <p className="mono" style={{ fontSize: "12px", color: "#16a34a" }}>✓ Everyone is settled up!</p>
                    : transactions.map((t, i) => (
                        <div key={i} className="settle-row">
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="avatar-lg" style={{ background: memberColor(t.from) }}>{initials(t.from)}</div>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 700 }}>{t.from}</div>
                              <div className="mono" style={{ fontSize: "11px", color: "#94a3b8" }}>owes {t.to}</div>
                            </div>
                          </div>
                          <div className="mono" style={{ fontSize: "16px", fontWeight: 700, color: "#f97316" }}>{fmt(t.amount)}</div>
                        </div>
                      ))
                }
              </div>
            </div>

            {/* Expenses */}
            <div className="card">
              <div className="eyebrow">Expenses</div>

              {selectedGroup.expenses.length === 0
                ? <p className="mono" style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "18px" }}>No expenses yet.</p>
                : <div style={{ marginBottom: "20px" }}>
                    {selectedGroup.expenses.map(exp => (
                      <div key={exp.id} className="expense-row">
                        <div className="avatar-lg" style={{ background: memberColor(exp.paid_by) }}>{initials(exp.paid_by)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>{exp.description}</div>
                          <div className="mono" style={{ fontSize: "11px", color: "#94a3b8" }}>paid by {exp.paid_by}</div>
                        </div>
                        <div className="mono" style={{ fontSize: "15px", fontWeight: 700, color: "#2563eb", marginRight: "12px" }}>{fmt(exp.amount)}</div>
                        <button className="btn-danger" onClick={() => deleteExpense(exp.id)}>Delete</button>
                      </div>
                    ))}
                  </div>
              }

              {/* Add expense */}
              <div style={{ background: "#f8fafc", border: "1px solid #e8eef6", borderRadius: "14px", padding: "16px" }}>
                <div className="eyebrow">Add Expense</div>
                <div className="expense-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "8px", alignItems: "end" }}>
                  <input className="tt-input" placeholder="Description" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} />
                  <input className="tt-input mono" type="number" placeholder="Amount" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} />
                  <select className="tt-select mono" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
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