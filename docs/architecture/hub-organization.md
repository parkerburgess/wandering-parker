# Hub Organization

`wandering-parker` is a Next.js 16 / React 19 App Router project. It is the landing
page (project cards and résumé) and the only sign-in UI for the whole site. It has
no database. Its content comes from local JSON, and everything about users goes
through the auth service.

```mermaid
graph TD
  user["User browser"]

  subgraph hub["wandering-parker"]
    proxy["proxy.ts<br/>verifies auth_token on every page<br/>(skips login, register, password pages, api/auth, images)"]

    subgraph pages["app/: pages"]
      layout["layout.tsx<br/>ThemeProvider · Header · Contact Me config"]
      home["page.tsx: / project cards"]
      resume["resume/page.tsx"]
      login["login/<br/>page · LoginForm · SignInCard · GuestAccessCard"]
      register["register/page.tsx"]
      pwd["forgot-password/ · reset-password/"]
    end

    subgraph api["app/api/auth/: server routes to the auth service"]
      r_login["login · guest"]
      r_register["register"]
      r_pwd["forgot-password · reset-password"]
      r_logout["logout"]
    end

    subgraph comp["app/_components/"]
      card["ProjectCard"]
      art["ProjectArt + project-art/*<br/>per-app SVG art on TwoToneArt"]
      profile["ProfilePanel"]
    end

    subgraph lib["lib/"]
      l_auth["auth.ts<br/>JWKS · getVerifiedAuthUser · isAuthDisabled"]
      l_proj["getProjects.ts · projectArt.ts"]
      l_resume["getResume.ts"]
      l_return["returnUrl.ts<br/>checks the return_url param"]
      l_resp["apiResponses.ts<br/>badRequest · unauthorized · forbidden · serverError"]
    end

    subgraph data["data/"]
      d_proj["projects.json"]
      d_resume["resume.json"]
    end

    decisions["decisions/<br/>ADRs 0001–0004"]
  end

  ui["@parkerburgess/wandering-parker-ui<br/>Header · Button · Input · Turnstile · Badge …"]
  auth["auth-wandering-parker"]

  %% request path
  user --> proxy --> pages
  proxy -.-> l_auth
  layout -.-> l_auth

  %% home page
  home --> l_proj --> d_proj
  home -->|"GET /api/user/apps<br/>(filters the cards)"| auth
  home --> card --> art
  home --> profile --> l_resume
  resume --> l_resume --> d_resume

  %% sign-in pages post to their own API routes
  login --> l_return
  login --> r_login
  register --> r_register
  pwd --> r_pwd
  layout -->|"Header menu"| r_logout

  %% API routes forward to the auth service
  r_login -->|"sign-in + token"| auth
  r_register -->|"sign-up"| auth
  r_pwd -->|"request / reset"| auth
  api -.-> l_resp

  %% shared UI + contact
  layout -->|"Contact Me posts to /api/contact"| auth
  l_auth -.->|"JWKS"| auth
  hub -. imports .-> ui
```

## How the folders split the work

| Folder | Role |
|---|---|
| `proxy.ts` | Next 16's request interceptor (it used to be `middleware.ts`). It runs before every page except the public sign-in pages, checks the JWT, and redirects to `/login` if it's missing or bad. |
| `app/` | Pages, one folder per route. They are server components unless they need browser state. The sign-in and password forms are client components. |
| `app/api/auth/` | The hub's own backend. These are the only places the hub talks to better-auth's sign-in, sign-up and password endpoints, and they set or clear the `auth_token` cookie. |
| `app/_components/` | Components used only by the hub. The leading `_` keeps Next from treating the folder as a route. Shared components come from wp-ui instead. |
| `lib/` | Plain TypeScript with no JSX: auth checks, data loaders and response helpers. |
| `data/` | The card and résumé content, edited by hand and bundled at build time. |
| `decisions/` | Architecture Decision Records: why each choice was made. |

## Notes

- **Two places check the token, on purpose.** `proxy.ts` guards the protected pages.
  `layout.tsx` calls `getVerifiedAuthUser` again because the layout also renders on
  the public pages that the proxy skips, and the Header still needs to know who is
  signed in there.
- **Only the home page asks the auth service for data at render time**
  (`/api/user/apps`). Everything else on the page comes from `data/*.json`.
- `lib/returnUrl.ts` is new and not yet committed. This diagram assumes it lands.
