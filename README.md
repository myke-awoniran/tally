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
│ └── withdrawal.interface.ts
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

# Procedural Testing

This section walks through a manual end-to-end validation of Tally’s double-entry guarantees, replayability, and balance
derivation.

The goal is to prove that:

- Ledger entries are the source of truth.
- Asset balances are merely cached projections.
- Transfers generate symmetric debit/credit rows.
- Balances can be deterministically rebuilt from the Ledgers.

---

### Prerequisites

1. Ensure MongoDB is running locally:

```bash
docker run -p 27017:27017 mongo
Install dependencies:
bun install
Start the Tally REPL:
bun run tally
```

## Seeded test users:

- Sender: user1@email.com
- Receiver: user2@email.com
  (You may reverse these if desired.)

## Test Scenario: Transfer 100 USD

```We will transfer 100 USD from Account A to Account B and verify correctness via ledger replay.```

## Step 1 — Perform Transfer

```
Initiate a transfer of 100 USD from user1@email.com to user2@email.com.
If successful, you should receive a confirmation message indicating the transfer completed.
```

## At this point:

- A single business transaction is created.
- A single Deposits record is created.
- A single Withdrawals record is created.
- Two symmetric ledger entries are appended:
- Debit: Sender asset
- Credit: Receiver asset
- No asset balances are directly mutated.

## Step 2 — Verify Asset Balances Remain Unchanged

Inspect both users’ Asset records.
You should observe:

- availableBalance has not changed for either user.
  This is intentional.
  Asset balances are treated as materialized projections, not authoritative state.

## All financial truth currently exists only in the ledger.

## Step 3 — Inspect Ledger Entries

- Query the ledger collection and confirm:
- Exactly two rows were created for the transfer.
- Both rows reference the same transaction ID.
- One entry debits Account A.
- One entry credits Account B.
- The deltas sum to zero.
- Invariant:
- Σ(credits) = Σ(debits)

Expected Outcome

```This confirms:
Ledger entries are immutable and authoritative.
Asset balances are derived, not primary.
Transfers produce symmetric accounting entries.
```

## Step 4 — Run Ledger Replay

Trigger the replay / reconciliation command.

```This process:
Scans all ledger entries.
Aggregates availableDelta grouped by asset.
Recomputes balances deterministically.
Updates availableBalance on each Asset.
No business transactions are re-executed.
Only projections are rebuilt.
```

## Step 5 — Recheck Asset Balances

Re-query both users’ Asset records.

```You should now see:
Sender balance decreased by 100 USD.
Receiver balance increased by 100 USD.
These values must exactly match what is implied by the ledger history.
```

Expected Outcome

```This confirms:
Ledger entries are immutable and authoritative.
Asset balances are derived, not primary.
Transfers produce symmetric accounting entries.
Replay correctly reconstructs state.
No partial or inconsistent balances exist.
If replay produces the correct balances, the system satisfies:
Double-entry integrity
Deterministic reconciliation
Projection correctness
Atomic transaction guarantees
```

