from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import uuid
import pytesseract
from PIL import Image

app = Flask(__name__)
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://isabellamoreno@localhost/triptally"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

class Group(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)

class Member(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String)
    group_id = db.Column(db.String, db.ForeignKey("group.id"))

class Expense(db.Model):
    id = db.Column(db.String, primary_key=True)
    description = db.Column(db.String)
    amount = db.Column(db.Float)
    paid_by = db.Column(db.String)
    group_id = db.Column(db.String, db.ForeignKey("group.id"))

def simplify_debts(balances):

    creditors = []
    debtors = []

    for person, balance in balances.items():
        if balance > 0:
            creditors.append([person, balance])
        elif balance < 0:
            debtors.append([person, -balance])

    transactions = []

    i = 0
    j = 0

    while i < len(debtors) and j < len(creditors):

        debtor, debt = debtors[i]
        creditor, credit = creditors[j]

        amount = min(debt, credit)

        transactions.append({
            "from": debtor,
            "to": creditor,
            "amount": round(amount, 2)
        })

        debtors[i][1] -= amount
        creditors[j][1] -= amount

        if debtors[i][1] == 0:
            i += 1

        if creditors[j][1] == 0:
            j += 1

    return transactions

@app.route("/")
def home():
    return {"message": "TripTally API running"}

def calculate_balances(group):

    balances = {}

    members = group["members"]

    if len(members) == 0:
        return []

    # initialize balances
    for member in members:
        balances[member["name"]] = 0

    # process expenses
    for expense in group["expenses"]:

        amount = float(expense["amount"])
        paid_by = expense["paid_by"]

        split_amount = amount / len(members)

        for member in members:
            balances[member["name"]] -= split_amount

        balances[paid_by] += amount

    return balances

# CREATE GROUP
@app.route("/groups", methods=["POST"])
def create_group():

    data = request.json

    group = Group(
        id=str(uuid.uuid4()),
        name=data["name"]
    )

    db.session.add(group)
    db.session.commit()

    return jsonify({
        "id": group.id,
        "name": group.name
    })


# GET GROUPS
@app.route("/groups", methods=["GET"])
def get_groups():

    groups = Group.query.all()

    result = []

    for g in groups:

        members = Member.query.filter_by(group_id=g.id).all()
        expenses = Expense.query.filter_by(group_id=g.id).all()

        result.append({
            "id": g.id,
            "name": g.name,
            "members": [
                {"id": m.id, "name": m.name} for m in members
            ],
            "expenses": [
                {
                    "id": e.id,
                    "description": e.description,
                    "amount": e.amount,
                    "paid_by": e.paid_by
                }
                for e in expenses
            ]
        })

    return jsonify(result)

# ADD MEMBER
@app.route("/groups/<group_id>/members", methods=["POST"])
def add_member(group_id):

    data = request.json

    member = Member(
        id=str(uuid.uuid4()),
        name=data["name"],
        group_id=group_id
    )

    db.session.add(member)
    db.session.commit()

    return jsonify({"status": "member added"})

# ADD EXPENSE
@app.route("/groups/<group_id>/expenses", methods=["POST"])
def add_expense(group_id):

    data = request.json

    expense = Expense(
        id=str(uuid.uuid4()),
        description=data["description"],
        amount=float(data["amount"]),
        paid_by=data["paid_by"],
        group_id=group_id
    )

    db.session.add(expense)
    db.session.commit()

    return jsonify({"status": "expense added"})


# Balance
@app.route("/groups/<group_id>/balances", methods=["GET"])
def get_balances(group_id):

    members = Member.query.filter_by(group_id=group_id).all()
    expenses = Expense.query.filter_by(group_id=group_id).all()

    balances = {m.name: 0 for m in members}

    if len(members) == 0:
        return jsonify({"balances": {}, "transactions": []})

    for expense in expenses:

        split_amount = expense.amount / len(members)

        for m in members:
            balances[m.name] -= split_amount

        balances[expense.paid_by] += expense.amount

    transactions = simplify_debts(balances)

    return jsonify({
        "balances": balances,
        "transactions": transactions
    })

# Receipt Scanning
@app.route("/scan-receipt", methods=["POST"])
def scan_receipt():

    file = request.files["receipt"]

    image = Image.open(file)

    text = pytesseract.image_to_string(image)

    total = None

    for line in text.split("\n"):
        if "total" in line.lower():

            numbers = [s for s in line.split() if s.replace('.', '', 1).isdigit()]

            if numbers:
                total = numbers[-1]

    return jsonify({
        "text": text,
        "total": total
    })

if __name__ == "__main__":
    app.run(debug=True)