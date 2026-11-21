# Innovate Connects — Brand Guidelines

**Version:** 1.0  
**Status:** Active canonical specification  
**Repository:** `koesac-lab/innovate-connects`  
**Language:** UK English (`en-GB`)

---

## 1. Brand Foundation

### Who we are
**Innovate Connects** is a serious telecoms adoption and wireless consultancy. We help UK public-sector and private-sector organisations move from connectivity ambition to confident, lasting adoption — connecting technology, people, and real-world outcomes.

### Core premise
Technology only creates value when it is trusted and used. The hardest part of deploying emerging connectivity is rarely the network itself; it is working out where it solves a real problem, bringing the right people into the conversation, and building practical pathways from trial to sustained adoption.

### Target audiences
- **UK regional and local government:** Authorities focused on improving community services, tourism, local economic growth, and digital infrastructure.
- **Industrial and large-footprint operators:** Manufacturing, ports, agriculture, and campus environments with complex physical footprints where standard mobile coverage is insufficient and continuous connectivity is operationally critical.
- **Telecoms and infrastructure teams:** Technical and commercial teams translating advanced network capability into propositions organisations understand, trust, and choose to adopt.

### Core services
1. **Research and perspectives:** Clarifying what emerging connectivity can do, where it solves a genuine problem, and what barriers stand in the way.
2. **Workshops and facilitation:** Bringing technical teams, decision-makers, and end users into the same room to align on the problem and agree clear next steps.
3. **Adoption strategy:** Turning technical evidence into prioritised choices, stakeholder plans, and measurable criteria for scaling from trial to delivery.

---

## 2. Naming and Shorthand

- **Primary name:** `Innovate Connects` — always use the full name in primary logo lockups, formal headers, page titles, and first references.
- **Secondary shorthand:** `ICONS` — use only in secondary contexts (monogram references, internal shorthand, compact labels) once the full name is established. Do not use mixed-case `iCons`.
- **Descriptors:** Keep consultancy descriptors (such as "Telecoms adoption consultancy" or "Wireless consultancy") separate from the logo lockup. Never bake a tagline into the logo.

---

## 3. Visual Direction: Evening-Luxe

Innovate Connects leads with an **evening-luxe** visual identity: dark, composed, tactile, and editorial.

- **Default surfaces:** Deep petrol ink and charcoal grounds carry the primary digital presence, creating quiet authority and letting gold filaments and woven ribbon artwork breathe.
- **Editorial light breaks:** Warm paper (`#f4ecdc` / `#f7f4eb`) is reserved for long-form reading sections, report interiors, and print documents where extended text benefits from a light ground.
- **Visual character:** Inspired by sculptural woven ribbons and organic signal flow — rich texture where it earns its place, disciplined restraint everywhere else.

---

## 4. Colour System

Petrol teal is the signature brand colour. Oxblood provides depth on underside folds and high-contrast callouts. Gold is used sparingly as a fine filament, rule, or highlight — never as a heavy flood.

### Core palette

| Role | Name | Hex | Primary usage |
| :--- | :--- | :--- | :--- |
| Primary brand | Petrol Teal | `#0a4f54` | Signature brand colour, dominant ribbon weave, primary interactive accents |
| Deep ground | Ink | `#171b1d` | Default dark page background, dark-mode base |
| Petrol ground | Petrol Ink | `#102e2c` | Deep petrol surfaces, footers, primary text on light paper |
| Structural dark | Charcoal | `#30373e` | Secondary dark panels, elevated dark surfaces, display text on paper |
| Secondary accent | Oxblood | `#7a2038` | Ribbon underside folds, high-contrast feature bands, focus accents |
| Filament accent | Gold | `#c49b4c` | Fine ribbon edge threads, hairline rules, primary dark-ground CTA fill |
| Highlight gold | Gold Light | `#d9b66e` | Subtle luminous highlights and hover states on dark surfaces |
| Accessible gold | Deep Gold | `#6a4e28` | Gold-family text accents and borders on light paper (WCAG AA contrast) |
| Primary light ink | Warm Paper | `#f4ecdc` | Primary body and heading text on dark grounds; light editorial sections |
| Secondary light | Cream | `#e2d2b4` | Hairline borders (`rgba(226, 210, 180, 0.25)`), subtle secondary text |

### Colour ratio and contrast rules
- **Dark-first balance:** Aim for roughly 70% deep ink/petrol/charcoal grounds, 15% warm paper/cream typography and rules, 10% petrol teal and oxblood depth, and 5% gold filaments.
- **Accessibility:** Maintain at least WCAG AA contrast (4.5:1 for body text, 3:1 for large display text and UI controls). Never set body copy in `#c49b4c` on light paper — use `#6a4e28` or `#102e2c` instead.

### Reference CSS tokens

```css
:root {
  --ic-ink: #171b1d;
  --ic-petrol-ink: #102e2c;
  --ic-charcoal: #30373e;
  --ic-petrol: #0a4f54;
  --ic-oxblood: #7a2038;
  --ic-gold: #c49b4c;
  --ic-gold-light: #d9b66e;
  --ic-gold-deep: #6a4e28;
  --ic-paper: #f4ecdc;
  --ic-cream: #e2d2b4;
  --ic-line: rgba(226, 210, 180, 0.25);

  --ic-serif: "Playfair Display", Georgia, serif;
  --ic-sans: "DM Sans", system-ui, -apple-system, sans-serif;
}
```

---

## 5. Typography

Innovate Connects uses a **two-family system**: Playfair Display for editorial authority and DM Sans for clarity and utility. **DM Mono is explicitly excluded** from the brand system.

| Role | Typeface | Weights | Styling guidance |
| :--- | :--- | :--- | :--- |
| Display & headings | **Playfair Display** | 500, 600 (roman & italic) | Tight tracking (`-0.05em` to `-0.06em`), tight leading (`0.96`–`1.05`). Use as an active visual element. |
| Body, UI & labels | **DM Sans** | 400, 500, 600 | Neutral tracking, comfortable leading (`1.55`–`1.65`). Sentence case for all labels, nav, and buttons. |

### Typographic rules
- **Line length:** Keep body copy under 80 characters per line (target `45ch`–`65ch` in editorial columns). Give serif body or pull quotes slightly more line-height than sans-serif.
- **Sentence case by default:** Use sentence case for headings, navigation, buttons, and metadata labels. Do not use tracked-out ALL-CAPS eyebrow labels.
- **No decorative emphasis:** Do not accent a single word in every headline with a colour swap or italic highlight as a habit. Use Playfair Display italic only when a phrase genuinely shifts tone or meaning.
- **No monospace metadata:** Use DM Sans (smaller size or muted warm paper/cream opacity) for dates, categories, and section markers rather than a monospace typeface.

---

## 6. Logo and Monogram System (Route 5: Woven IC)

The active mark is **Woven IC**: a compact, right-facing sculptural ribbon **C** crossed vertically by a solid, matte **I**.

### Construction rules
- **Form:** A broad, sculptural right-facing capital **C** with a generous right-hand opening and subtly asymmetric tips, crossed vertically by a solid capital **I** positioned slightly left of the opening's centre.
- **Interlock:** The **C** passes *behind* the **I** at the upper crossing and *in front* at the lower crossing, leaving the centre of the **I** exposed and continuous within the vertical bounds of the **C**.
- **Material contrast:** The **C** carries all movement and woven filament texture (deep petrol teal weave, restrained oxblood underside folds, fine gold edge threads, and 2–3 tiny luminous points inside the silhouette). The **I** stays completely flat and matte (warm ivory/paper on dark grounds; deep petrol ink on light grounds).

### Two-tier production rule
1. **Flat master SVG (everyday use):** Prove the exact IC geometry in single-colour flat ink first so it reads cleanly at `16 px`, `32 px`, and site-header sizes on both dark and light backgrounds — without reading as a power icon, copyright mark, or slashed C.
2. **Rich woven render (hero/print use):** Apply the sculptural ribbon treatment to that exact same silhouette for large placements such as report covers, presentation title slides, and standalone brand moments.

### Logo restrictions
- Never add generic Wi-Fi arcs, signal bars, floating particles, taglines, or mockup frames to the mark.
- Do not place the rich woven logo directly beside full-bleed ribbon hero artwork; use the quiet flat mark in the header when hero artwork is present.
- Maintain generous clear space around the mark (at least the width of the vertical `I` stem on all sides).

---

## 7. Artwork, Layout, and Motion

All web and digital design work follows the repository's `SKILL.md` design discipline alongside these brand rules:

- **One bold moment per page:** Let the signature woven ribbon artwork (or a strong typographic hero) carry the visual drama. Keep surrounding sections quiet, structured, and free of visual clutter.
- **No generic SaaS chrome:** Avoid identical rounded cards with soft grey drop shadows, gradient washes used as filler, middle-dot metadata chains (`A · B · C`), spaced em-dash prefixes, and decorative arrows (`→`) appended to every button or link.
- **Meaningful structure:** Use hairline rules (`--ic-line`), borders, and numbered markers (`01`, `02`, `03`) only when they encode real hierarchy or sequence.
- **Mobile-first and accessible:** Every layout must work cleanly down to small mobile screens, preserve visible keyboard focus states, and honour `prefers-reduced-motion`.
- **Deliberate motion:** Avoid repetitive scroll fade-and-slide animations on every section. Use motion for one orchestrated reveal or to confirm direct user actions.

---

## 8. Voice and Copywriting

Words in Innovate Connects materials exist to make complex decisions clearer — never as decorative filler.

- **Tone:** Senior, grounded, conversational, and direct. Confident without hype; technical without hiding behind jargon.
- **Problem-first framing:** Start with what the organisation or community needs to achieve, then connect it to what the network makes possible.
- **Active voice and plain verbs:** Write clear calls to action that name what happens next (e.g., "See how we work", "Read the perspective", "Start a conversation") rather than vague labels like "Submit" or "Learn more".
- **Consistent vocabulary:** Keep the name of an action or service consistent across navigation, headings, buttons, and confirmation states.
- **Honest states:** If something is unavailable, empty, or in error, state plainly what happened and what to do next without apologising or being vague.

### Copy examples
- **Prefer:** "Turn powerful connectivity into lasting adoption."  
  **Avoid:** "Next-generation wireless transformation solutions for the digital future."
- **Prefer:** "Start with the problem, not the network."  
  **Avoid:** "Leveraging 5G/NTN synergies to unlock seamless hyper-connectivity."
