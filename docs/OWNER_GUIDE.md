# Owner guide — hotfix test copy

The live app has not been changed. This draft needs data-safety work before a
production upgrade. Test using a separate browser profile.

## Enter a bill

Open New Invoice. Select the party, add the items, and check the date and total.
For a parcel, enter quantity per parcel and the number of packs. Existing bills
keep their saved final quantity. Save once, then check the invoice on Sale List.

![New invoice on a phone](../test-results/screenshots/new-sale-390.png)

## Find bills and receive money

Use Sale List search and date filters. Rows chooses 20, 50 or 100 records per page.
Next/Prev reaches the rest. Click a column to sort. The summary covers the entire
filtered list. Receive only what is outstanding; an excess payment is rejected.

![Sale list](../test-results/screenshots/sales-list-1366.png)

## Delete PIN

The first delete asks you to set a new PIN. This step does not delete the record.
Choose Delete again, enter your PIN, and confirm with Enter or Delete. Escape or
Cancel closes the dialog. Change the PIN in Settings; supply the current PIN.
**Deletion is still permanent in this draft. Take a backup first.**

## End-of-day routine

Use Export Backup and keep a dated copy outside the browser. Keep older copies.
Do not clear browser/site data. Automatic backup and complete audit backup are
not available yet. Use one tab and one master device. A changed web address,
file path or browser can show an empty shop because storage belongs to that
address. Keep the old profile; restore a backup only after testing it separately.

Existing keyboard shortcuts remain. Escape closes the new PIN dialog and Enter
confirms. A complete keyboard-first shortcut redesign is not included yet.
