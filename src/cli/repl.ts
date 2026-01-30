import readline from 'readline';
import {LedgerEngine} from '../services/ledger.service';
import {connectMongoDb} from "../database";

await connectMongoDb();
console.log('\nWelcome to Tally Ledger Console\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    console.log(`
==============================
        TALLY MENU
==============================

1) Help
2) Transfer
3) Audit Account
4) Audit Transaction
5) Replay Ledger
6) Validate Ledger
7) Exit

Select option:
`);
}

function ask(question: string): Promise<string> {
    return new Promise((resolve) => rl.question(question, resolve));
}

export async function mainLoop() {
    showMenu();
    while (true) {
        const choice = await ask('> ');

        try {
            switch (choice.trim()) {
                case '1':
                    printHelp();
                    break;

                case '2':
                    await handleTransfer();
                    break;

                case '3':
                    await handleAuditAccount();
                    break;

                case '4':
                    await handleAuditTransaction();
                    break;

                case '5':
                    await handleReplay();
                    break;

                case '6':
                    await handleValidate();
                    break;

                case '7':
                    console.log('Goodbye 👋');
                    process.exit(0);
                default:
                    console.log('Invalid option');
            }
        } catch (err: any) {
            console.error('Error:', err.message || err);
        }
    }
}

// ---------------- Handlers ----------------

async function handleTransfer() {
    const from = await ask('Sender user ID: ');
    const to = await ask('Receiver user ID: ');
    const amount = await ask('Amount (Minimum of GBP 100.00): ');

    await LedgerEngine['withdraw']({
        senderAccountId: from.trim(),
        receiverAccountId: to.trim(),
        amount: Number(amount),
    });
    console.log('\nTransfer completed\n');
}

async function handleAuditAccount() {
    const account = await ask('UserAsset ID: ');
    const rows = await LedgerEngine.auditAccount(account.trim());
    console.table(
        rows.map((r) => ({
            asset: r.asset,
            delta: r.availableDelta,
            balance: r.availableBalance,
            tx: r.transaction
        }))
    );
}

async function handleAuditTransaction() {
    const tx = await ask('Transaction ID: ');
    const rows = await LedgerEngine.auditTransaction(tx.trim());
    console.table(rows);
}

async function handleReplay() {
    const balances = await LedgerEngine.replay();
    console.log('\n♻️ Replay complete\n');
    console.table([...balances.entries()]);
}

async function handleValidate() {
    await LedgerEngine.validateLedger();
    console.log('\n✅ Ledger invariant holds\n');
}

function printHelp() {
    console.log(`
This console allows you to interact with the Tally ledger.

2) Transfer:
   Moves value between two user accounts using double-entry accounting.

3) Audit Account:
   Shows all ledger entries for a UserAsset.

4) Audit Transaction:
   Shows ledger entries for a transaction.

5) Replay Ledger:
   Rebuilds all balances from ledger history.

6) Validate Ledger:
   Ensures global debit/credit invariant holds.

All balances are derived from the append-only ledger.
`);
}

mainLoop();
