# Managing Records

This guide covers how to edit and delete records in KaGet.

## Editing a Record

1. Find the record in your wallet details or transaction list
2. Tap the record to open it
3. Tap the **Edit** button (pencil icon)
4. Update the fields you want to change
5. Tap **Save**

### What You Can Edit

| Field      | Editable | Notes                                                                       |
| ---------- | -------- | --------------------------------------------------------------------------- |
| **Type**   | ✅ Yes   | Changing from Income to Expense (or vice versa) affects balance accordingly |
| **Wallet** | ✅ Yes   | Moving record to different wallet updates both wallets' balances            |
| **Amount** | ✅ Yes   | Balance adjusts by the difference                                           |
| **Note**   | ✅ Yes   | No effect on balance                                                        |
| **Date**   | ✅ Yes   | No effect on balance                                                        |

### How Balance Updates Work

When you edit a record, your wallet balance adjusts automatically:

| Change                   | Balance Effect                                               |
| ------------------------ | ------------------------------------------------------------ |
| Amount $50 → $75         | Balance changes by $25 (in the direction of the record type) |
| Income → Expense         | Balance decreases by 2× the amount                           |
| Expense → Income         | Balance increases by 2× the amount                           |
| Move to different wallet | Old wallet reverses, new wallet applies                      |

> **Example:** You recorded a $100 expense but it was actually $120.
>
> Edit the record and change amount to `120`. Your wallet balance automatically decreases by an additional $20.

## Deleting a Record

1. Find the record you want to delete
2. Tap the record to open it
3. Tap the **Edit** button
4. Tap **Delete Record**
5. Confirm the deletion

### What Happens When You Delete

- The record is permanently removed
- Your wallet balance is adjusted (reversed)
  - Deleted income → balance decreases
  - Deleted expense → balance increases

> **⚠️ Warning:** Deletion cannot be undone. If you made a mistake, consider editing the record instead.

### Deleting Split Records

When you delete a record that has multiple items (split record):

- The entire record is deleted, including all items
- Balance is reversed by the full amount

To remove just one item from a split, edit the record instead of deleting it.

## Common Scenarios

| Situation                   | What to Do                     |
| --------------------------- | ------------------------------ |
| Wrong amount                | Edit the record, update amount |
| Wrong wallet                | Edit the record, change wallet |
| Duplicate entry             | Delete one of the duplicates   |
| Wrong type (income/expense) | Edit the record, change type   |
| Transaction didn't happen   | Delete the record              |

## Related

- [Creating Records](./creating-records.md) — Add new records
- [Split Records](./split-records.md) — Work with multi-item records
