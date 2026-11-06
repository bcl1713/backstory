# Issue 94: intermittent formatter timeout

The original November 6 New Note timeout remains unexplained. Its exact draft,
deployed image identity and resource conditions were not retained. A successful
reconstructed draft is not a regression test. This change delivers evidence for
a recurrence; it does not claim to fix the original incident or attribute it to
input size, cold startup, load or the equal deadlines.

## Local investigation

Baseline: dev `e064e2ba41de43b7cda7e2c34d3ed83b01d2cc54`, Node 22.23.4, forge.
The unchanged real-helper integration suite passed 55 cases. A synthetic sweep
ran 48 helper calls: repeated byte-identical notes with YAML, prose, links,
lists/tables/quotes and unmatched brackets, roughly 1/4/16/64 KB, plus serial
and four-way concurrent 3,927-byte list requests. All returned `ok`. Ordinary
4 KB cases took roughly 0.5–0.7 seconds, while the slowest 64 KB structured
case took 4.73 seconds. No latency gate was imposed and host resource conditions
were not a controlled replica of the deployment.

An instrumented follow-up measured 38 calls (24 cold, six warm, eight four-way
concurrent) with the new repeatable probe. All returned `ok`; 4 KB cold requests
took 0.507–0.672 seconds, four-way 3,927-byte calls took 0.598–0.689 seconds,
and repeated warm calls took 0.085–0.329 seconds, excluding module import.
The slowest 64 KB structured call took 4.911 seconds. Per-stage data identifies
module startup and all real formatting work separately. Instrumented measurements
were taken on a dirty candidate based on the stated baseline, not a deployed image.
The final PR/release record supplies clean-commit gate and publication evidence.

A deterministic exhausted-uptime test exercises Node's actual timer, worker
termination, failed result and scratch cleanup without waiting ten seconds.
Separate real-process tests exercise Python's deadline, retained last stage,
child-process termination, stderr flooding and scratch cleanup. This demonstrates
both timeout paths and the ability to distinguish them; it is not a reproduction
of the reported content-dependent incident.

## Next evidence needed

Deploy the published diagnostic build through the normal operator workflow.
For a recurrence, retain its source-free formatter event and log timestamp,
verify the image revision/version, and identify the longest stage interval and
whether Python or Node expired (including `worker_timeout` before cleanup).
Use the same generated input and approved synthetic configuration for controlled
comparisons of cold/warm work and resource limits before choosing a fix. The
original private note need not be logged or posted to an issue.

Do not raise deadlines, remove fixed-point verification, reuse workers, replay
writes or bypass formatting as a speculative fix. Issue 94 should remain open
until an evidenced cause has a failing regression and a verified correction.
