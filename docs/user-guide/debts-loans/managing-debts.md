# Managing Debts

This guide covers tracking money you've borrowed from others.

## What is a Debt?

A debt is money you borrowed — you owe it to someone. When you create a debt:

- Your wallet balance **increases** (you received money)
- You have a **payable** to track

When you repay the debt:

- Your wallet balance **decreases** (you paid it back)
- The debt is marked as **resolved**

## Creating a Debt

1. Go to **Debts & Loans**
2. Tap **Add Debt**
3. Fill in the details:

| Field      | Required | Description                           |
| ---------- | -------- | ------------------------------------- |
| **Amount** | Yes      | How much you borrowed                 |
| **From**   | Yes      | Name of the person you borrowed from  |
| **Wallet** | Yes      | Which wallet received the money       |
| **Date**   | Yes      | When you borrowed (defaults to today) |
| **Note**   | No       | Additional details                    |

4. Tap **Save**

### What Happens

When you create a debt:

```
Wallet balance: $500 → $600 (+$100)
Debts list: "You owe $100 to John"
```

A record is automatically created to track this transaction.

## Viewing Your Debts

The Debts & Loans screen shows:

- **Pending debts** — Money you still owe
- **Resolved debts** — Debts you've paid back

Each debt shows:

- Amount
- Who you owe
- Date borrowed
- Status (pending/resolved)

## Editing a Debt

You can edit a pending debt before marking it as paid:

1. Find the debt in your list
2. Tap the debt to open details
3. Tap **Edit**
4. Update amount, who you borrowed from, date, or note
5. Tap **Save**

> **Note:** Resolved debts cannot be edited. To change a resolved debt, delete it and create a new one.

Changing the amount updates your wallet balance to reflect the difference.

## Marking a Debt as Paid

When you repay someone:

1. Find the debt in your list
2. Tap the debt to open details
3. Tap **Mark as Paid**
4. Confirm the repayment

### What Happens

When you mark a debt as paid:

```
Wallet balance: $600 → $500 (−$100)
Debt status: Pending → Resolved ✓
```

A repayment record is automatically created.

## Deleting a Debt

If you created a debt by mistake:

1. Find the debt in your list
2. Tap the debt to open details
3. Tap **Delete**
4. Confirm deletion

### What Happens

When you delete a debt:

- The original record is deleted
- Your wallet balance is reversed
- If already paid, the repayment record is also deleted

> **Warning:** Deleting a debt removes all related transaction history.

## Example Scenario

### Borrowing Money

> **Situation:** You borrow $200 from Sarah for rent.
>
> 1. Tap **Add Debt**
> 2. Amount: `200`
> 3. From: `Sarah`
> 4. Wallet: **Bank Account**
> 5. Note: `Rent help`
> 6. Tap **Save**
>
> Result:
>
> - Bank Account: +$200
> - Pending debt: "You owe $200 to Sarah"

### Paying Back

> **Situation:** Next month, you pay Sarah back.
>
> 1. Open the debt "Sarah - $200"
> 2. Tap **Mark as Paid**
> 3. Confirm
>
> Result:
>
> - Bank Account: −$200
> - Debt resolved ✓

## Tips

- **Add notes** — Include details like "for rent" or "emergency"
- **Track promptly** — Add debts when they happen so you don't forget
- **Review regularly** — Check your pending debts to stay on top of payments

## Related

- [Managing Loans](./managing-loans.md) — Track money you lent
- [Creating Records](../records/creating-records.md) — How records work
