# 20-minute rehearsal in a test copy

Use a separate browser profile with synthetic records. Never clear the live app.
This rehearsal is still required; automated tests do not prove your printer works.

1. Open the test copy. Confirm the shop name says Synthetic/Test, not your real shop.
2. Create a customer and two items. Include a name with an apostrophe and quotation marks.
3. Enter three invoices. Use parcel multiplication on one and open-box quantity on another. Check totals before saving.
4. On Sale List, change Rows to 50. Sort by invoice number, then date. Use Next/Prev with more than 20 test records.
5. Take a part payment. Check paid + balance equals total. Try paying ₹1 above the remaining balance; the record must not change.
6. Pay the exact remaining balance. Check balance becomes zero and payment history adds up to paid.
7. Cancel one invoice. Check it is marked Cancelled; restore it and check the totals return.
8. Export a backup of the test profile. Keep the file. Set a new non-default delete PIN when prompted; the setup must not delete a record.
9. Delete one test invoice using the new PIN. **Restore from Recycle Bin is not available in this checkpoint.** Do not do this to a real invoice.
10. Import the backup only into a second test profile. Check records/totals manually. Audit round-trip is not expected to pass until Release 2.
11. View and print a one-line and a long invoice on your printer. Check amount, tax, party name and page breaks.
12. Reopen the test app from disk offline. Confirm you understand that a different URL/file path/browser has different storage.

Stop using this draft if an amount changes unexpectedly, a record is missing, or
an error appears. Keep the backup and the original browser profile intact.
