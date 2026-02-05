# Using Budgets

This guide covers how to spend from budgets, add funds, refund, and manage archived budgets.

## Spending from a Budget

When you spend money allocated to a budget:

1. Open the **budget** you want to spend from
2. Tap **Add Expense**
3. Enter the **amount**
4. (Optional) Add a **note**
5. Tap **Save**

The expense is recorded and your budget balance decreases.

> **Note:** You're creating a record from the budget context. The expense is linked to the budget, not the original wallet.

### Spending Rules

| Rule               | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| No overspending    | You cannot spend more than the budget balance                |
| Budget only        | Expenses reduce budget balance, not wallet balance           |
| Tracked separately | Budget expenses appear in budget details, not wallet details |

## Viewing Budget Details

Open any budget to see:

| Element           | Description                           |
| ----------------- | ------------------------------------- |
| **Balance**       | Remaining amount available to spend   |
| **Used**          | Amount spent so far                   |
| **Progress bar**  | Visual percentage of budget used      |
| **Source wallet** | Which wallet the budget came from     |
| **Expenses**      | List of all expenses from this budget |

## Adding Funds to a Budget

Need more in a budget? You can top it up from the source wallet.

1. Open the budget
2. Tap **Add Funds**
3. Enter the **amount** to add
4. Tap **Confirm**

The amount is transferred from your wallet to the budget.

### Add Funds Rules

| Rule                              | Description                                       |
| --------------------------------- | ------------------------------------------------- |
| Same wallet only                  | Funds must come from the original source wallet   |
| Cannot exceed wallet balance      | You can only add what's available in the wallet   |
| Cannot exceed original allocation | Budget balance cannot grow beyond `total_balance` |

> **Example:** You created a $500 grocery budget and spent $300 (balance: $200). You can add up to $300 to restore it to the original $500, but not beyond.

## Refunding to Wallet

Have unused budget funds? Return them to your wallet.

1. Open the budget
2. Tap **Refund**
3. Enter the **amount** to return (or tap "Refund All")
4. Tap **Confirm**

The amount is transferred back to your wallet.

### Refund Rules

| Rule                         | Description                              |
| ---------------------------- | ---------------------------------------- |
| Cannot exceed budget balance | You can only refund what's in the budget |
| Returns to source wallet     | Money goes back to the original wallet   |
| Partial or full              | Refund any amount up to the full balance |

## Archiving

Budgets are **automatically archived** when their balance reaches zero.

### What Happens When Archived

- Budget moves to the **Archived** section
- No more spending allowed
- Read-only: you can view expenses but not add new ones
- Cannot be deleted (preserves history)

### Viewing Archived Budgets

1. Go to **Budgets**
2. Tap **Archived** tab
3. View any archived budget to see its expense history

### Why No Delete?

Budgets cannot be deleted because:

- They involve wallet transfers (create, add, refund)
- Deleting would create ambiguity in balance history
- Archive preserves your spending records

If you created a budget by mistake and haven't used it, refund the full balance—it will auto-archive with zero expenses.

## Reactivating a Budget

Archived budgets can be **reactivated** for reuse—perfect for recurring monthly budgets.

1. Go to **Budgets** > **Archived** tab
2. Open the budget you want to reactivate
3. Tap **Reactivate**
4. Choose your allocation:
   - **Same amount** — Restore with the original allocation
   - **New amount** — Set a different allocation for this cycle
5. Tap **Confirm**

The allocation is deducted from the source wallet, and the budget is active again.

### Reactivation Rules

| Rule                   | Description                                       |
| ---------------------- | ------------------------------------------------- |
| Must be archived       | Only archived budgets can be reactivated          |
| Wallet must have funds | Source wallet needs sufficient balance            |
| History preserved      | All previous expenses remain linked to the budget |
| Allocation flexible    | Choose same or different amount each time         |

### Why Reactivate Instead of Create New?

- **Continuous history** — See all spending across multiple cycles
- **Less clutter** — No duplicate budget names in archives
- **Faster setup** — One tap to restore a recurring budget

## Budget States

| State        | Balance | Can Spend | Can Add | Can Refund | Can Reactivate |
| ------------ | ------- | --------- | ------- | ---------- | -------------- |
| **Active**   | > 0     | ✅ Yes    | ✅ Yes  | ✅ Yes     | ❌ No          |
| **Archived** | = 0     | ❌ No     | ❌ No   | ❌ No      | ✅ Yes         |

## Common Scenarios

| Situation                  | What to Do                                        |
| -------------------------- | ------------------------------------------------- |
| Budget running low         | Add funds from wallet (up to original allocation) |
| Unused budget at month end | Refund to wallet                                  |
| Overspent category         | Reallocate from another budget (refund + add)     |
| Created by mistake         | Refund all → auto-archives with no expenses       |
| New month, same budget     | Reactivate from archives                          |

## Related

- [Creating Budgets](./creating-budgets.md) — Set up new budgets
- [Goals](./goals.md) — Saving goals work differently
