# Anton Iosifov — Software Engineering Portfolio

A production-focused portfolio presenting commercial, startup, and independent work across web, mobile, cloud, and AI-enabled systems.

[Live portfolio](https://antoniosifov.com) · [LinkedIn](https://www.linkedin.com/in/anton-iosifov/) · [GitHub](https://github.com/antoniosifov)

## Overview

The site is a statically exported Next.js application built to load quickly, remain accessible, and present detailed engineering work without turning the portfolio into a wall of technology names.

It includes:

- production client platforms and independently developed products;
- outcome-first project summaries with expandable engineering notes;
- startup, freelance, education, and certification history;
- responsive navigation and keyboard-accessible interactions;
- image lazy loading and optimized WebP assets;
- complete social metadata, JSON-LD, sitemap, robots, and manifest;
- optional privacy-conscious analytics;
- automated deployment to GitHub Pages with a custom domain.

## Selected work

| Project | Summary | Links |
| --- | --- | --- |
| Ceru | App Store release for six-language, multi-currency mobile expense sharing with offline-first sync and AI-powered voice and receipt input | [App Store](https://apps.apple.com/us/app/ceru-split-group-expenses/id6759336973) · [Product site](https://ceruapp.com/) |
| Sea’cret Residences | Four-language real-estate marketing and lead-generation platform with Sanity CMS, SEO/GEO, analytics, accessibility, and enquiry workflows | [Live site](https://www.seacret-residence.com/) |
| Campus42 | Interactive student-housing platform with floor and studio selection, CMS content, localization, SEO/GEO, and transactional enquiries | [Live site](https://campus42.gr/en) |
| AWS EC2 Observability | Interactive dashboard for CloudWatch CPU, network, disk, credit, and health metrics | [Demo](https://aws-cpu-utilization-metrics-six.vercel.app/) · [Source](https://github.com/antoniosifov/aws-cpu-utilization-metrics) |
| Agentic RAG Assistant | Grounded enterprise knowledge assistant with cited sources, relevance scores, and explicit fallback disclosure | [App](https://rag-chat-frontend-sigma.vercel.app/) · [Backend](https://github.com/antoniosifov/rag-chat-backend) |
| Ski Shop | Full-stack e-commerce with customer and admin workflows, analytics, authentication, and AI recommendations | [Demo](https://e-commerce-ski.vercel.app/) · [Source](https://github.com/antoniosifov/e-commerce-ski) |

## Technology

| Area | Technologies |
| --- | --- |
| Framework | Next.js 16 App Router, React 19 |
| Language | TypeScript 5 |
| Rendering | Static export for GitHub Pages |
| Animation | Layered CSS hero sequence, transitions, and reduced-motion fallbacks |
| Delivery | GitHub Actions, GitHub Pages, custom domain |
| Quality | Strict TypeScript, semantic HTML, reduced-motion support, responsive QA |

## Project structure

```text
app/
|-- layout.tsx          # Global metadata, analytics, JSON-LD, and root layout
|-- page.tsx            # Semantic page composition
|-- globals.css         # Design system, layout, animation, and responsive styles
|-- robots.ts           # Static robots metadata route
|-- sitemap.ts          # Static sitemap metadata route
`-- manifest.ts         # Web app manifest
components/
|-- HeroScene.tsx       # Optimized, layered cinematic hero sequence
|-- Projects.tsx        # Accessible project case studies and lazy galleries
`-- ...                 # Page sections and reusable UI
data/
`-- portfolio.ts        # Typed portfolio content
public/
|-- img/                # Optimized project and profile media
|-- og-image.png        # Social sharing image
|-- Anton_Iosifov_CV.pdf
`-- CNAME               # GitHub Pages custom domain
scripts/
|-- optimize-images.mjs
`-- create-og-image.mjs
```

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
git clone https://github.com/antoniosifov/portfolio.git
cd portfolio
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Validate a production build with:

```bash
npm run typecheck
npm run build
```

The static export is generated in `out/`.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`. The workflow installs dependencies, builds the static Next.js export, and deploys `out/` to GitHub Pages. The custom domain is retained through `public/CNAME`.

## Optional analytics

Analytics stay disabled unless the following variables are configured locally and as GitHub Actions secrets:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Domain registered in Plausible |
| `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL` | Optional custom or self-hosted Plausible script |

## Contact

- [antoniosifov.com](https://antoniosifov.com)
- [linkedin.com/in/anton-iosifov](https://www.linkedin.com/in/anton-iosifov/)
- [github.com/antoniosifov](https://github.com/antoniosifov)
