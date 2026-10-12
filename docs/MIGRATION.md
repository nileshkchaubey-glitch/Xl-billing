# Migration status and rollback

No new billing-data migration is implemented in the hotfix. No owner data was
read or changed during this work. The baseline's automatic v5/v15 migrations
remain a risk; they do not yet have the requested full recoverable snapshot and
verification protocol.

On explicit PIN setup/change, settings.deletePinSalt and settings.deletePinHash
replace settings.deletePin. Old plaintext PINs are accepted only as the current
credential for this explicit operation. Default 1234 cannot authorize deletion.
This is not a migration of invoices or payments.

The baseline expects settings/items/parties/invoices/purchases/retail in v4/v5
backup objects, with payments using `amt`, and localStorage keys prefixed shop4_.
Historical shape fixtures and verification against every release have **not**
been completed. The baseline inventory lists literal storage keys.

Rolling the HTML back to baseline does not undo a deletion or payment, and the
baseline does not recognize the new PIN hash. For testing rollback, export an
independent backup before changing the test copy. Keep the old backup file. Do
not experiment with imports, clearing storage or rollback on the live profile.
A byte-exact complete restore including audit/secrets requires the unimplemented
Release 2 backup work.
