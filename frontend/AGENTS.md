# Agent Instructions for Simple SIMRS Frontend

This guide outlines design system rules, component conventions, and operational workflows for AI coding assistants and frontend developers on the Simple SIMRS project. Follow these patterns to keep UI components accessible, predictable, and aligned with the Astryx Design System.

<!-- ASTRYX:START -->
Astryx v0.7.17 · 174 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — start every page from a template, never from scratch:
1. `astryx build "<idea>"` — names the template to scaffold from and the parts it lacks.
2. `astryx template <name> <path>` — scaffold it; keep its frame, gap and padding; replace the content.
3. `astryx component <Name>` to read props before using one; `astryx template <Block>` prints a block example to read for a part it lacks. Astryx names differ from other libraries: buttons, badges, tokens and tabs take their text in `label` (Text, Heading and Link take children), booleans start with `is` or `has` (`isOpen`, `isDisabled`), and every input takes `value` and `onChange`.
Changing an existing page? Keep it: skip step 2 and add components inside its sections; read a block example when it helps.
Before you deliver a build, run `astryx doctor --built <dir>`; don't deliver it if it fails.

RULES:
- No <div> — components handle all layout and spacing.
- Read `astryx docs layout` before changing a template's frame.
- Dense data = rows (Table, List/Item), not Card-wrapped lists. Badge = counts only.
- Style with component props first, then tokens (var(--color-*|--spacing-*|--radius-*)). No raw hex/px. No StyleX/Tailwind compiler here — don't use xstyle/utility classes directly. Some templates use StyleX and need a compiler plugin; see `astryx docs styling-overview`.
- THEMES: palettes and custom colors go through the theme, never :root overrides; so does a denser or roomier app (`editor set <name> spacing tight`), never gap and padding changes page by page. A change to one kind of part (the sidebar, its selected item, the gaps in a form) is a theme change too, not props on one page: `editor how "<ask>"` names the `set … --on <part>` line. No app yet: `astryx experimental theme preview app <dir>` makes a starter app that shows the theme. To make or change a theme (colors, fonts, corners, spacing, a look from a picture), prefer the experimental theme editor over hand-written theme files: `astryx experimental theme editor new <name> --like neutral`, then `editor set <name> <thing> <value>` or `editor how "<what you want>"`; wire it with `astryx theme add <name>`; after each change look at it with `astryx experimental theme editor show <name> --png` (takes pictures of real components) and open the PNGs it writes; a theme change is not done until you have looked at the pictures. In code, extend an imported theme to customize it; `theme eject <slug>` only forks source. See `astryx docs theme`.
- SELF-CHECK: re-read the file; replace any raw <div>/<span>, imported .css/@apply, or hardcoded #hex/px with the component or a token.

`astryx help` lists every command. Key ones beyond the workflow:
  search "<query>"   find any component / hook / doc / template
  discover <words>   integrations you could add
  docs <topic>       getting-started, principles, tokens, theme … (`astryx docs` lists all)
  docs cli           commands and API reference
  docs authoring     build an integration package, and every field it holds
  upgrade --from <old version> --apply   run after a dependency bump
To remove this block, run `astryx init --remove-agents`, which removes it from the agent files at the project root and in the folder you run it in; from any other file it leaves, delete everything from ASTRYX:START to ASTRYX:END.
<!-- ASTRYX:END -->

## Astryx Design System Overview for Simple SIMRS

Astryx delivers an agent-ready component ecosystem based on React 19 and StyleX. The system manages spacing, typography, and accessibility within component primitives so you avoid arbitrary wrapper elements and non-standard utility classes.

### Base Setup

The application loads stylesheets once in the single global entry file (`src/index.css`):

```css
@import '@astryxdesign/core/astryx.css';
@import '@astryxdesign/theme-neutral/theme.css';
```

The root provider locks the interface to light mode:

```tsx
import { Theme } from '@astryxdesign/core';
import { themes, defaultThemeSlug } from './astryx-themes';

<Theme theme={themes[defaultThemeSlug]} mode="light">
  <App />
</Theme>
```

## Core Component Conventions

Import shared UI components from `@/components/ui` to maintain consistent styling across feature modules.

### Button (`@astryxdesign/core/Button` or `@/components/ui/Button`)

Follow these prop requirements when placing buttons:

- **Required `label` prop**: Astryx requires a descriptive string label for accessible screen reader output.
- **Prefix boolean props with `is` or `has`**: Use `isLoading` and `isDisabled` instead of `loading` or `disabled`.
- **Supported variants**: Use `'primary' | 'secondary' | 'ghost' | 'destructive'`.

```tsx
import { Button } from '@/components/ui';

<Button
  label="Save Patient Record"
  variant="primary"
  isLoading={isSaving}
  onClick={handleSave}
/>
```

### TextInput (`@astryxdesign/core/TextInput` or `@/components/ui/Input`)

Configure inputs with explicit labels and handlers:

- **Required `label` prop**: Always supply an explicit label string.
- **Change handler**: Accepts `(value: string, event) => void` or standard event delegates.
- **Validation feedback**: Supply an error message string to highlight invalid input.

```tsx
import { Input } from '@/components/ui';

<Input
  label="Medical Record Number"
  value={rmNumber}
  onChange={(e) => setRmNumber(e.target.value)}
  error={formErrors.rmNumber}
  placeholder="e.g. RM-2026-0001"
  required
/>
```

### Badge (`@astryxdesign/core/Badge` or `@/components/ui/Badge`)

Display patient triage status, queue counts, or state indicators with badges:

- **Label content**: The `label` prop accepts text strings or React nodes.
- **Supported variants**: Use `'neutral' | 'info' | 'success' | 'warning' | 'error' | 'teal'`.

```tsx
import { Badge } from '@/components/ui';

<Badge label="Inpatient" variant="warning" />
```

### Card (`@astryxdesign/core/Card` or `@/components/ui/Card`)

Wrap structured sections with card containers:

- **Elevation levels**: Choose from `'none' | 'low' | 'med' | 'high'`.
- **Padding scale**: Specify integer padding from `1` to `10`.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card elevation="low" padding={4}>
  <CardHeader>
    <CardTitle>Selected Patient Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Clinical data summary content goes here.</p>
  </CardContent>
</Card>
```

### Alert and Banner (`@astryxdesign/core/Banner` or `@/components/ui/Alert`)

Surface system alerts and validation messages:

- **Supported status types**: Use `'info' | 'warning' | 'error' | 'success'`.

```tsx
import { Alert } from '@/components/ui';

<Alert variant="danger" title="Save Failed">
  The system encountered an error connecting to the backend service.
</Alert>
```

### Reusable Data Table (`@/components/ui/DataTable`)

Render dense hospital records using the generic `DataTable<T>` component:

- **Sticky header**: Stays visible at `top: 0` with `z-index: 10`.
- **Sticky right action column**: Stays pinned at `right: 0` with `z-index: 5`.
- **Sticky intersection cell**: Anchors at `top: 0` and `right: 0` with `z-index: 20` to prevent visual collision during diagonal scrolling.
- **Embedded features**: Supports debounced query search, multi-column sorting, and pagination.

## Rules of Engagement for AI Agents

Follow these mandatory rules when editing or creating frontend code:

- **Use Astryx Primitives First**: Do not construct bespoke HTML wrappers when an Astryx component covers the use case.
- **Maintain a Single Global Stylesheet**: Store all global styling in `src/index.css`. Never create isolated CSS files like `App.css` or `styles.css`.
- **Enforce Light Mode Only**: The application supports light mode exclusively. Never add dark mode media queries or theme toggle controls.
- **Use Theme Tokens**: Reference semantic CSS variables such as `var(--color-primary)` and `var(--space-4)` instead of hardcoded hex colors or pixel measurements.
- **Audit Interface Health**: Run `npx astryx doctor` before submitting UI modifications to catch stylesheet and token violations.
- **Explore Components via CLI**: Run `npx astryx search "<term>"` to find existing components, and run `npx astryx component <Name>` to check component prop definitions.
