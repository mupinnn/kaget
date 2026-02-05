# Managing Loans

This guide covers tracking money you've lent to others.

## What is a Loan?

A loan is money you lent — someone owes it to you. When you create a loan:

- Your wallet balance **decreases** (you gave money out)
- You have a **receivable** to track

When you collect the loan:

- Your wallet balance **increases** (you got it back)
- The loan is marked as **resolved**

## Creating a Loan

1. Go to **Debts & Loans**
2. Tap **Add Loan**
3. Fill in the details:

| Field      | Required | Description                       |
| ---------- | -------- | --------------------------------- |
| **Amount** | Yes      | How much you lent                 |
| **To**     | Yes      | Name of the person you lent to    |
| **Wallet** | Yes      | Which wallet the money came from  |
| **Date**   | Yes      | When you lent (defaults to today) |
| **Note**   | No       | Additional details                |

4. Tap **Save**

### What Happens

When you create a loan:

```
Wallet balance: $500 → $400 (−$100)
Loans list: "John owes you $100"
```

A record is automatically created to track this transaction.

## Viewing Your Loans

The Debts & Loans screen shows:

- **Pending loans** — Money owed to you
- **Resolved loans** — Loans that have been repaid

Each loan shows:

- Amount
- Who owes you
- Date lent
- Status (pending/resolved)

## Collecting a Loan

When someone pays you back:

1. Find the loan in your list
2. Tap the loan to open details
3. Tap **Mark as Collected**
4. Confirm the collection

### What Happens

When you mark a loan as collected:

```
Wallet balance: $400 → $500 (+$100)
Loan status: Pending → Resolved ✓
```

A collection record is automatically created.

## Deleting a Loan

If you created a loan by mistake:

1. Find the loan in your list
2. Tap the loan to open details
3. Tap **Delete**
4. Confirm deletion

### What Happens

When you delete a loan:

- The original record is deleted
- Your wallet balance is reversed
- If already collected, the collection record is also deleted

> **Warning:** Deleting a loan removes all related transaction history.

## Example Scenario

### Lending Money

> **Situation:** Your friend Mike needs $50 for gas.
>
> 1. Tap **Add Loan**
> 2. Amount: `50`
> 3. To: `Mike`
> 4. Wallet: **Cash**
> 5. Note: `Gas money`
> 6. Tap **Save**
>
> Result:
>
> - Cash: −$50
> - Pending loan: "Mike owes you $50"

### Getting Paid Back

> **Situation:** Mike pays you back next week.
>
> 1. Open the loan "Mike - $50"
> 2. Tap **Mark as Collected**
> 3. Confirm
>
> Result:
>
> - Cash: +$50
> - Loan resolved ✓

## Tips

- **Add notes** — Include what the loan was for
- **Track everyone** — Even small amounts add up
- **Follow up** — Use pending loans as a reminder to collect

## Related

- [Managing Debts](./managing-debts.md) — Track money you borrowed
- [Creating Records](../records/creating-records.md) — How records work
