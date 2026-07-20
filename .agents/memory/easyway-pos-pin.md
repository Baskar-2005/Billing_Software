---
name: EasyWay POS default PIN
description: The login UI requires exactly 6 digits; default PIN in DB is 123456.
---

# EasyWay POS PIN length

## The rule
The login page (`artifacts/easyway-pos/src/pages/login.tsx`) only submits when exactly 6 digits are entered. The DB schema default PIN must also be 6 digits.

**Why:** The original Vercel project had `default("1234")` in the settings schema but a 6-dot UI — a mismatch that made login impossible.

**How to apply:** Default PIN is `"123456"`. Users can change it in Settings. The Zod schema allows 4–6 digits (`min(4).max(6)`), but the UI always collects exactly 6.
