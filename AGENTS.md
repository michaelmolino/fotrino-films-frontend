# Agent Instructions

Apply these rules to all work in this repository.

- Make changes everywhere they are needed. Do not add backward compatibility shims, wrappers, or compatibility layers.
- Prefer strict contracts over defensive fallbacks. If input or state is invalid, fail instead of silently compensating.
- Do not normalize data unless the user explicitly asks for it. Treat normalization as a sign that the source contract needs fixing.
- Avoid thin wrapper functions. If a function only forwards work and is used in a few places, inline the logic instead.
