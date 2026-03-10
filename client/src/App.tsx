import { useState, useEffect } from "react";
import axios from "axios";

function App() {

  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const [memberName, setMemberName] = useState("");

  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [transactions, setTransactions] = useState<any[]>([])

  const fetchGroups = async () => {
    const res = await axios.get("http://127.0.0.1:5000/groups");
    setGroups(res.data);
  };


  const createGroup = async () => {

    if (!groupName) return;

    await axios.post("http://127.0.0.1:5000/groups", {
      name: groupName
    });

    setGroupName("");
    fetchGroups();
  };


  const addMember = async (groupId: string) => {

    if (!memberName) return;

    await axios.post(`http://127.0.0.1:5000/groups/${groupId}/members`, {
      name: memberName
    });

    setMemberName("");
    fetchGroups();
  };

  const deleteGroup = async (groupId: string) => {

    await axios.delete(`http://127.0.0.1:5000/groups/${groupId}`)
  
    setSelectedGroup(null)
    fetchGroups()
  }

  const addExpense = async (groupId: string) => {

    if (!expenseDesc || !expenseAmount || !paidBy) return;

    await axios.post(`http://127.0.0.1:5000/groups/${groupId}/expenses`, {
      description: expenseDesc,
      amount: expenseAmount,
      paid_by: paidBy
    });

    setExpenseDesc("");
    setExpenseAmount("");
    setPaidBy("");

    fetchGroups();
  };

  const deleteExpense = async (expenseId: string) => {

    await axios.delete(`http://127.0.0.1:5000/expenses/${expenseId}`)
  
    fetchGroups()
  }

  const calculateBalances = async (groupId: string) => {

    const res = await axios.get(
      `http://127.0.0.1:5000/groups/${groupId}/balances`
    )
  
    setTransactions(res.data.transactions)
  }

  useEffect(() => {
    fetchGroups();
  }, []);


  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>

      <h1>TripTally</h1>

      <div style={{ marginBottom: "20px" }}>

        <input
          placeholder="Enter group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <button onClick={createGroup}>
          Create Group
        </button>

      </div>


      <h2>Groups</h2>
        {groups.map((group) => (
          <div key={group.id}>

            <button onClick={() => setSelectedGroup(group)}>
              {group.name}
            </button>

          </div>
        ))}
        {selectedGroup && (
          <div>
            <h2>{selectedGroup.name}</h2>
          </div>
        )}

        <button onClick={() => deleteGroup(selectedGroup.id)}>
          Delete Group
        </button>

        {selectedGroup && (

        <div style={{ marginTop: "30px" }}>

          <h2>{selectedGroup.name}</h2>

          <strong>Members</strong>

          {selectedGroup.members.map((member: any) => (
            <div key={member.id}>{member.name}</div>
          ))}

          <div>

            <input
              placeholder="Add member"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />

            <button onClick={() => addMember(selectedGroup.id)}>
              Add Member
            </button>

          </div>


          <h4>Expenses</h4>

          {selectedGroup.expenses.map((expense: any) => (
            <div key={expense.id}>
              {expense.description} - ${expense.amount} (paid by {expense.paid_by})

              <button onClick={() => deleteExpense(expense.id)}>
                Delete
              </button>
          </div>
        ))}

          <div>

            <input
              placeholder="Description"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
            />

            <input
              type="number"
              placeholder="Amount"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
            />

            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
            >

              <option value="">Select who paid</option>

              {selectedGroup.members.map((member: any) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}

            </select>

            <button onClick={() => addExpense(selectedGroup.id)}>
              Add Expense
            </button>

          </div>


          <button onClick={() => calculateBalances(selectedGroup.id)}>
            Calculate Balances
          </button>

          <h3>Balances</h3>

          {transactions.map((t, i) => (
            <div key={i}>
              {t.from} owes {t.to} ${t.amount}
            </div>
          ))}

        </div>

        )}

      </div>
        );
      }
    export default App;