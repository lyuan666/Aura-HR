## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. The
skill has multi-step workflows, checklists, and quality gates that produce better
results than an ad-hoc answer. When in doubt, invoke the skill. A false positive is
cheaper than a false negative.

Key routing rules:

- Product ideas, "is this worth building", brainstorming → invoke /office-hours
- Strategy, scope, "think bigger", "what should we build" → invoke /plan-ceo-review
- Architecture, "does this design make sense" → invoke /plan-eng-review
- Design system, brand, "how should this look" → invoke /design-consultation
- Design review of a plan → invoke /plan-design-review
- Developer experience of a plan → invoke /plan-devex-review
- "Review everything", full review pipeline → invoke /autoplan
- Bugs, errors, "why is this broken", "wtf", "this doesn't work" → invoke /investigate
- Test the site, find bugs, "does this work" → invoke /qa (or /qa-only for report only)
- Code review, check the diff, "look at my changes" → invoke /review
- Visual polish, design audit, "this looks off" → invoke /design-review
- Developer experience audit, try onboarding → invoke /devex-review
- Ship, deploy, create a PR, "send it" → invoke /ship
- Merge + deploy + verify → invoke /land-and-deploy
- Configure deployment → invoke /setup-deploy
- Post-deploy monitoring → invoke /canary
- Update docs after shipping → invoke /document-release
- Weekly retro, "how'd we do" → invoke /retro
- Second opinion, codex review → invoke /codex
- Safety mode, careful mode, lock it down → invoke /careful or /guard
- Restrict edits to a directory → invoke /freeze or /unfreeze
- Upgrade gstack → invoke /gstack-upgrade
- Save progress, "save my work" → invoke /context-save
- Resume, restore, "where was I" → invoke /context-restore
- Security audit, OWASP, "is this secure" → invoke /cso
- Make a PDF, document, publication → invoke /make-pdf
- Launch real browser for QA → invoke /open-gstack-browser
- Import cookies for authenticated testing → invoke /setup-browser-cookies
- Performance regression, page speed, benchmarks → invoke /benchmark
- Review what gstack has learned → invoke /learn
- Tune question sensitivity → invoke /plan-tune
- Code quality dashboard → invoke /health

## Project engineering rules

- Local, server, and Mac mini Worker code must stay on the same Git commit. Before claiming a deployment or fix is complete, verify `git rev-parse HEAD` on all three environments and report the commits.
- Mac mini Worker is an execution node with permission to auto-sync. Keep `deploy/macmini-worker-sync.sh` and the LaunchAgent installed so it can pull the latest `main`, build the API, clean runtime artifacts, and restart `yzschros-worker` only after a successful build.
- If local/server/worker commits differ, fix synchronization first. Do not treat business tests from mismatched code as final evidence.
- Runtime cleanup is mandatory. Remove logs, scratch scripts, temporary test scripts, old audit scripts, caches, `__pycache__`, `.next`, and generated artifacts that are not needed by the running service.
- Production or worker cleanup must preserve required runtime build outputs, especially `apps/api/dist` on the Mac mini Worker.
- Do not leave tracked files with hardcoded credentials, temporary tokens, one-off database cleanup scripts, or obsolete debug code.
- Local automation agents for review, QA, bug memory, and project management must stay local-only under ignored paths such as `.local-agents/` and `.agent-memory/`. Do not commit, push, deploy, expose ports for, or sync these agents to the server or Mac mini Worker.
