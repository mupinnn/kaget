# Managing Wallets

This guide covers how to rename and delete wallets in KaGet.

## Renaming a Wallet

1. Open the wallet you want to rename
2. Tap the **Edit** button (pencil icon)
3. Update the wallet **name**
4. Tap **Save**

> **Note:** You can only change the wallet name. To adjust the balance, create a new record (income or expense) or a transfer.

## Why Can't I Edit the Balance?

KaGet calculates your balance from your transaction history. This ensures your balance is always accurate and matches your records.

To adjust a balance:

| Situation                      | What to Do                        |
| ------------------------------ | --------------------------------- |
| Balance too low                | Record an income transaction      |
| Balance too high               | Record an expense transaction     |
| Money moved to another account | Create a transfer                 |
| Opening balance was wrong      | Edit the "Opening Balance" record |

## Deleting a Wallet

1. Open the wallet you want to delete
2. Tap the **Edit** button (pencil icon)
3. Tap **Delete Wallet**
4. Confirm the deletion

### What Gets Deleted

When you delete a wallet, **all associated data is permanently removed**:

| Data                  | What Happens                                               |
| --------------------- | ---------------------------------------------------------- |
| **Records**           | All income and expense records for this wallet are deleted |
| **Transfers**         | Transfers from this wallet's perspective are deleted; the other party may still see their side (with this wallet's name preserved) |
| **Budgets**           | All budgets linked to this wallet are deleted              |

> **⚠️ Warning:** This action cannot be undone. Consider exporting your data before deleting a wallet.

### When to Delete vs. When to Keep

| Situation                         | Recommendation                        |
| --------------------------------- | ------------------------------------- |
| Closed a bank account             | Delete if you don't need the history  |
| Want a fresh start                | Delete and recreate                   |
| Account inactive but want history | Keep the wallet (balance stays at $0) |
| Made the wallet by mistake        | Delete immediately                    |

## Related

- [Creating Wallets](./creating-wallets.md) — Set up new wallets
- [Wallet Details](./wallet-details.md) — View wallet information
