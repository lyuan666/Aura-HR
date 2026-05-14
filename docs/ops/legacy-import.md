# Legacy Candidate Import

1. Export old owned database candidates to NDJSON.
2. Run dry-run first.
3. Review counts by decision.
4. Run actual import.
5. Open `/imports` to review staging rows.
6. Promote only A/B quality rows.

The importer never writes directly to `candidates`.
