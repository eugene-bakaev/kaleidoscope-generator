<!-- BEGIN:nextjs-agent-rules -->
# Branching convention
When transitioning from planning to implementation and the current branch is `main`, always create a feature branch before making any code changes. Name it descriptively (e.g. `feat/pivot-point-canvas-scale`).

# Git operations
Only create commits, merge branches, or push to remote when the user explicitly requests it. The sole exception is creating a feature branch when transitioning from planning to implementation (see above). Do not bundle merge+push together unless both are explicitly asked for in the same message.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
