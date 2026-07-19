# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.12] - 2026-07-19

### Fixed

- Navigation links now stay highlighted when you jump to a section near the bottom of the page, such as the FAQ.

## [1.0.11] - 2026-07-18

### Added

- SVG Stripper joins the directory under a new Web and design group.

## [1.0.10] - 2026-07-18

### Changed

- The not-found page now carries the same crisp site icon as the rest of the site.

## [1.0.9] - 2026-07-18

### Changed

- The page starts in the dark theme by default before scripts run.

## [1.0.8] - 2026-07-16

### Fixed

- The GitHub infrastructure repo `.github` no longer surfaces as a junk card in the "Fresh from GitHub" section. Dot-prefixed meta repos are filtered out, so only real projects appear.
- Newly discovered repositories are now registered with the search index, so a live "Fresh from GitHub" card filters and clears with a query like every other card.
- The 404 page was a stale copy of a sibling tool. It now uses the correct version and project-absolute asset paths (so a deep 404 renders styled and works offline), its sub-navigation points at the hub's real sections, its "other tools" grid lists all seven tools (AI Paste Cleaner was missing), and a leftover "Ruleset (JSON)" link and a mismatched lede were removed.
- `prefers-reduced-motion` now pauses the page's SVG animations, which CSS rules cannot stop.
- Theme reading and writing survive blocked browser storage instead of throwing.
- The back-to-top button leaves the keyboard tab order while it is hidden.
- `timeAgo` uses singular units for a count of one ("1 month ago", not "1 months ago").
- Category search matches whole words and prefixes, as documented, instead of arbitrary substrings (so "round" no longer matches "working around ai").
- A fresh card's link is validated as an http(s) URL, and a never-pushed repository sorts to the bottom of the fresh list rather than the top.

### Changed

- The three "Working around AI" cards name their new command-line, npm, and GitHub Action surfaces, and carry matching search tags so a search like "npm" or "cli" surfaces the tools that ship those channels.
- A `theme-color` meta follows the active theme; PNG and Apple touch icons were added for Safari and home-screen pins.
- Added a `SECURITY.md`, and `author`, `repository`, and `private` to package.json, matching the sibling repos.

## [1.0.7] - 2026-07-15

### Added

- A sponsor heart in the navigation, beside the theme toggle: quiet at rest, GitHub sponsor pink on hover, with the toggle's own downward tooltip and arrow, linking to the GitHub Sponsors profile. On the 404 page too.

## [1.0.6] - 2026-07-12

### Fixed

- The strip above the navigation bar is solid now. iOS skips the frosted blur in the overscroll zone, so the translucent skin let content ghost through it; the bleed wears the opaque page background, which reads identically to the bar over an empty page in both themes.

## [1.0.5] - 2026-07-12

### Fixed

- The navigation bar now bleeds its own skin above the viewport, so iOS elastic scrolling, the collapsing Safari chrome, and desktop rubber-banding show navigation instead of a bare transparent strip. Works in both themes.

## [1.0.4] - 2026-07-12

### Added

- A purpose-built 1280x640 social preview card, and the page's link-sharing metadata now points at it with honest dimensions.

## [1.0.3] - 2026-07-12

### Changed

- The navigation bar's soft shadow shows at all times now instead of appearing on scroll.

## [1.0.2] - 2026-07-12

### Added

- The navigation bar lifts with a soft, tight shadow once the page scrolls beneath it, and sits flush again at the top. Each theme carries its own tint.

## [1.0.1] - 2026-07-12

### Fixed

- The hero scene's mini cards now ride the theme map, so light mode shows white cards with green accents instead of dark tiles stranded on a light frame.

## [1.0.0] - 2026-07-12

### Added

- The directory: every tool as a card with its scene, description, and tags, grouped into WordPress toolkit, Working around AI, and WHMCS and hosting.
- Ranked search across names, tags, categories, and descriptions, with a slash shortcut.
- A Latest strip sorted by real push dates, and live self-updating from the public GitHub API: stars and dates refresh, and new public repositories appear on their own.
- The suite shell: light and dark themes, the ambient scene, offline support, a branded 404, and the usual accessibility affordances.

[1.0.8]: https://github.com/JaydenYoonZK/projects/releases/tag/v1.0.8
[1.0.7]: https://github.com/JaydenYoonZK/projects/releases/tag/v1.0.7
[1.0.6]: https://github.com/JaydenYoonZK/projects/releases/tag/v1.0.6
[1.0.5]: https://github.com/JaydenYoonZK/projects/releases/tag/v1.0.5
[1.0.4]: https://github.com/JaydenYoonZK/projects/releases/tag/v1.0.4
[1.0.3]: https://github.com/JaydenYoonZK/projects/releases/tag/v1.0.3
[1.0.2]: https://github.com/JaydenYoonZK/projects/releases/tag/v1.0.2
[1.0.1]: https://github.com/JaydenYoonZK/projects/releases/tag/v1.0.1
[1.0.0]: https://github.com/JaydenYoonZK/projects/releases/tag/v1.0.0
