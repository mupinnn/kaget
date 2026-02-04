# Split Records

Split records let you record multiple items in a single transaction—perfect for shopping trips, bills with multiple charges, or any situation where one payment covers several things.

## Overview

A split record contains:

- **Parent record** — The overall transaction (wallet, type, date)
- **Items** — Individual line items, each with its own amount and note

The total amount shown is the sum of all items.

## When to Use Split Records

| Scenario               | Example                                                    |
| ---------------------- | ---------------------------------------------------------- |
| **Shopping trip**      | Groceries: milk $4, bread $3, eggs $5 = $12 total          |
| **Restaurant bill**    | Food $25, drinks $10, tip $7 = $42 total                   |
| **Utility bill**       | Electric $80, water $30, gas $40 = $150 total              |
| **Paycheck breakdown** | Base salary $3000, bonus $500, overtime $200 = $3700 total |

## Creating a Split Record

1. Start creating a new record as usual
2. Tap **Add Items** (or **Split** button)
3. For each item:
   - Enter the **amount**
   - (Optional) Add a **note** describing the item
   - Tap **Add Another** for more items
4. Review the **total** (sum of all items)
5. Tap **Save**

### Example: Recording a Shopping Trip

> **Scenario:** You spent $47 at the store on various items.
>
> 1. Tap **Add Record**
> 2. Select **Expense**
> 3. Select **Cash**
> 4. Tap **Add Items**
> 5. Add items:
>    - $15 — "Groceries"
>    - $22 — "Household supplies"
>    - $10 — "Snacks"
> 6. Verify total shows $47
> 7. Tap **Save**

## Editing Split Records

### Adding an Item

1. Open the record
2. Tap **Edit**
3. Tap **Add Item**
4. Enter the new item details
5. Tap **Save**

The total amount updates automatically.

### Removing an Item

1. Open the record
2. Tap **Edit**
3. Swipe the item left (or tap the delete icon)
4. Tap **Save**

The total amount updates automatically.

### Editing an Item

1. Open the record
2. Tap **Edit**
3. Tap the item you want to change
4. Update the amount or note
5. Tap **Save**

## How Amounts Work

| Action           | Effect                          |
| ---------------- | ------------------------------- |
| Add item         | Total increases by item amount  |
| Remove item      | Total decreases by item amount  |
| Edit item amount | Total adjusts by the difference |

The record's total amount always equals the sum of its items. You cannot set the total manually when using split records.

## Converting Between Regular and Split

### Regular → Split

1. Edit the record
2. Tap **Add Items**
3. The current amount becomes the first item
4. Add more items as needed

### Split → Regular

Not directly supported. To convert:

1. Note the total amount
2. Delete the split record
3. Create a new regular record with that amount

## Tips

- **Group related items** — Keep one split record per transaction/receipt
- **Use notes effectively** — Brief descriptions help you remember what each item was
- **Check the total** — Verify it matches your receipt before saving

## Related

- [Creating Records](./creating-records.md) — Basic record creation
- [Managing Records](./managing-records.md) — Edit and delete records
