# Agent Instructions

Apply these rules to all work in this repository.

- Make changes everywhere they are needed. Do not add backward compatibility shims, wrappers, or compatibility layers.
- Prefer strict contracts over defensive fallbacks. If input or state is invalid, fail instead of silently compensating.
- Do not normalize data unless the user explicitly asks for it. Treat normalization as a sign that the source contract needs fixing.
- Avoid thin wrapper functions. If a function only forwards work and is used in a few places, inline the logic instead.
- Prefer existing libraries over custom implementations. Before introducing new code, look for a well-maintained library or an existing implementation already used in the repository.
- Prefer removing or simplifying code over introducing new abstractions.
- Refactor opportunistically. When touching an area of code, simplify it if doing so reduces overall complexity without changing behavior.
- Avoid premature abstraction. Do not introduce interfaces, base classes, helper functions, configuration options, or extension points unless there is a demonstrated need for multiple implementations.
- Prefer straightforward code over clever code. Readability and maintainability are more important than reducing line count.
- Consolidate duplicate logic instead of creating variants. If two code paths differ only slightly, prefer a single implementation with a clear contract.
- Remove dead code rather than preserving it for possible future use.
- Minimize dependencies between modules. Prefer moving logic to its natural owner rather than introducing cross-module coordination.
- Keep solutions as simple as possible while satisfying the requirements.
