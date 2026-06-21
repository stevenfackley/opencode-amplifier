---
description: Generate distinctive product/app/company names (creative-naming) with rationale + availability
model: lmproxy/gpt-5.1     # <-- a strong model for creative range; replace with a real ID
---

Follow the `creative-naming` skill. From the concept below: extract the essence, generate 15–20
candidates ACROSS several techniques (metaphor, coined word, classical root, borrowed word,
oblique real word, portmanteau, phonetics-first), then cut to a shortlist of 5.

For each shortlisted name give: the technique, why it fits, and a one-line risk (pronunciation,
meaning, likely-taken). Avoid every banned pattern (-ly/-ify, Smart-/AI-/Get-, generic
Hub/Cloud tails, literal compounds).

If a domain-availability tool is configured (e.g. GoDaddy `domains_check_availability` /
`domains_suggest`), check `.com` + alternates for the shortlist and report results.

Concept:
$ARGUMENTS
