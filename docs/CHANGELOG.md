# Changelog

## v0.5.3
- Added E2E verify runner and Makefile verify targets
- Added ops troubleshooting guide
- Migration readiness notes

## v0.5.2
- Added Makefile helpers (make smoke-up, smoke, reset)
- Added E2E reset script with safe deletion of synthetic records
- Improved docker run docs for E2E

## v0.5.1
- Added end-to-end smoke test harness (full commerce loop)
- Added QA checklist and troubleshooting notes

## v0.5.0
- Lifecycle hardening (atomic accept, payment steps, idempotent delivery completion)
- Minimal admin monitoring dashboard (read-only)
- UI updates for payment + ready-for-delivery

## v0.4.0
- Added DeliveryDraft model and rider draft lifecycle
- Added rider draft endpoints (open/assigned, accept, status update)
- Added rider mobile UI for drafts and job status updates
- Connected order → delivery lifecycle (READY_FOR_DELIVERY → draft)

## v0.3.0
- Internal alpha baseline
