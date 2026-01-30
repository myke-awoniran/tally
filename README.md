## Tally:: Double-Entry Ledger System (Elysia + MongoDB)

> Tally is a proof-of-concept financial ledger system demonstrating double-entry accounting, append-only journals, and
> atomic
> balance transitions using:

- Elysia (Bun runtime)

- MongoDB (Mongoose)

- UUID-based entities

- Immutable ledger entries

- Deterministic reconciliation

---

This project models deposits and withdrawals as transactional state machines backed by a proper double-entry ledger. It
is intentionally systems-oriented — focusing on correctness, invariants, and auditability rather than UI.

## Goals

This repository exists to demonstrate:

- Proper double-entry bookkeeping.

- Atomic debit/credit updates.

- Append-only ledger design.

- Deterministic replay and balance derivation from journal.

- Financial invariants enforcement.

> Specifically:

- Every transaction produces at least two ledger entries.

- Assets are never mutated directly without ledger backing.

- All balances are derivable from ledger history.

- Failed operations leave no partial state.

## Core Concepts

1. Assets = Accounts

Each user owns assets (accounts). Assets represent current materialized balances; they are derived state.

```Typescript
const AssetSchema = new Schema({
    id: String,
    user: String,
    symbol: String,
    availableBalance: Number,
    withdrawalActivity: Boolean,
    depositActivity: Boolean,
});
```

2. Transactions = Intent

Transactions capture business meaning (Deposit, Withdrawal, or optional Transfer). They include metadata like amount,
fee, clerkType, and status, but they do not mutate balances directly.

3. Ledger = Source of Truth

> Ledger entries are immutable and append-only. Balances are simply cached projections of this data.

> Each entry records: asset, user, transaction, availableDelta, resultingBalance, and debit/credit type.

- Double Entry Model
  Every operation produces symmetric entries to ensure the invariant:

∑credits=∑debits
Scenario Account Delta
Deposit (100 USD)   User Asset +100
System Clearing -100

Withdrawal (50 USD)    User Asset -50
System Clearing +50

# Project Structure

````Plaintext
src/
├── app.ts
├── db/
│ └── connect.ts
├── models/
│ ├── asset.model.ts
│ ├── transaction.model.ts
│ ├── ledger.model.ts
│ ├── deposit.model.ts
│ └── withdrawal.model.ts
├── services/
│ ├── ledger.service.ts
│ ├── deposit.service.ts
│ └── withdrawal.service.ts
├── routes/
│ ├── deposit.route.ts
│ └── withdrawal.route.ts
└── interfaces/
    ├── deposit.interface.ts
    └── withdrawal.interface.ts
````

# Data Models

> The Deposit and Withdrawal models represent commands, not accounting. The Ledger handles the actual financial logic.

```TypeScript
const DepositSchema = new Schema({
    _id: {type: String, default: uuidv4},
    user: String,
    asset: String,
    amount: Number,
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED']
    },
    transaction: {
        type: String,
        ref: 'transactions'
    }
}, {timestamps: true});
```

# Ledger Engine
The centralized ledger.service.ts manages the following workflow within MongoDB sessions:

Validate sufficient balance.

Start MongoDB session/transaction.

Insert Business Transaction record.

Insert TWO ledger rows (Symmetric).

Update materialized balances in the Asset model.

Commit (or rollback on any failure).

# Guarantees: 
- Atomicity: MongoDB sessions ensure no partial writes or "ghost" balances.

- Immutability: Ledger entries are never updated, only appended.

- Replayability: You can recompute balances at any time by running: SUM(availableDelta) GROUP BY asset.

- Auditability: Every change includes a transactionId, clerkType, and a "before/after" delta snapshot.

# Wanna run this project on your machine?
Install: bun install

Start Mongo: docker compose up -d

Run Server: bun dev