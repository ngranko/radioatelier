# Filter UI mockups — categories & tags

Five interactive, self-contained HTML mockups for filtering map objects by
**category**, **public tags**, and **private tags**. Built to review and pick a
direction before any real implementation.

## How to view

Open `index.html` in a browser (no build, no server needed — just double-click).
From there, jump into any of the five mocks. Each mock has a control strip at the
bottom to toggle **light / dark** theme and **desktop / phone** layout.

## The five directions

| #   | Name              | Idea                                                                              |
| --- | ----------------- | --------------------------------------------------------------------------------- |
| 1   | Лента-пилюля      | A pill under search expands into a horizontal chip rail. Most compact.            |
| 2   | Фасетный поповер  | Icon button → anchored popover with searchable, grouped facets + live count.      |
| 3   | Панель-шторка     | Side drawer (desktop) / bottom sheet (phone) with accordions and checkboxes.      |
| 4   | Командное меню    | ⌘K-style palette — type to filter across all categories and tags at once.         |
| 5   | Контрол карты     | Map-native control on the right rail; active filters ride a strip over the map.   |

## Notes

- These are **mock-only** static files — not wired into the SvelteKit app, Convex,
  or Google Maps. They are deliberately throwaway prototypes.
- Design tokens (oklch palette, `.glass`, radii, fonts) mirror `src/styles/app.css`;
  category colors mirror `markerStyling.data.ts`. Sample category/tag data is
  illustrative.
- `shared.css` / `shared.js` hold the common scaffold (faux map, top bar, theme +
  device chrome); each `mockN.html` adds only its own filter UI and logic.
