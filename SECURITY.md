# Security Policy

## Reporting a vulnerability

If you find a security issue in this directory site, please report it privately rather than opening a public issue.

Use [GitHub's private vulnerability reporting](https://github.com/JaydenYoonZK/projects/security/advisories/new).

Please include steps to reproduce and, if you have one, a suggested fix.

## Scope

This is a static directory page. It handles no user data and its only network call is an unauthenticated read of the public GitHub repository list, which it renders into cards. The interesting surface is that rendered data: reports about unescaped repository fields reaching the DOM, an unexpected repository surfacing as a card, or a link built from an untrusted URL are in scope.

## Supported Versions

Security fixes are applied to the latest release. The site has zero runtime dependencies by design; if you find that no longer true, that is also a bug worth reporting.
