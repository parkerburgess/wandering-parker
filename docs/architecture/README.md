# Architecture Diagrams

Mermaid diagrams for the Wandering Parker site. They live in fenced ` ```mermaid `
blocks, so editing the text edits the diagram. GitHub renders them automatically,
and VS Code does with the *Markdown Preview Mermaid Support* extension.

| Diagram | Shows |
|---|---|
| [System overview](system-overview.md) | The hub, the 3 apps, the auth service, the shared packages, Azure SQL and the outside services |
| [Auth flow](auth-flow.md) | Sign in, sign up and verify, visiting an app page, guest sign-in and sign-out, and who checks AppAccess |
| [Hub organization](hub-organization.md) | How this repo's folders split the work |

## Conventions

- **Solid arrow:** a request or data flow.
- **Dotted arrow:** a package import, or a JWT check against the auth service's
  public keys (JWKS).
- Each app owns one schema on the shared Azure SQL database, and the auth service
  owns `dbo`.
