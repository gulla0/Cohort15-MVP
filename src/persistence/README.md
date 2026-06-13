# Persistence

This directory owns repository modules, seed data, schema metadata, credit ledger primitives, and local persistence stores.

The default app path uses in-memory repositories for isolated test and demo runs. Durable local mode is enabled by setting `COHORT15_PERSISTENCE_FILE` to a JSON file path before starting the server. The JSON store persists users, events, event interests, credit transactions, and social posts behind the same repository API.

Credit balances must remain derived from `creditTransactions`; durable mode stores the transaction log rather than mutable balances.
