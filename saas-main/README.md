# Acelera Intelligence

Premium dark **e-commerce & marketplace intelligence** dashboard — visual MVP.

A high-end BI-style dashboard that unifies performance across **Mercado Livre, Shopee, Amazon e Loja Própria**. This is the stable visual foundation (Phase 1): the **Visão Geral** screen with mock data only.

> No authentication, database, payments, or real marketplace API connections yet. All data is mock.

## Stack

- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS v4**
- **Recharts** (charts)
- **lucide-react** (icons)

## Features (Visão Geral)

- Slim, expandable left sidebar navigation (10 sections)
- Clean top bar: page title, search, Importar Dados, notifications, profile
- KPI cards with per-metric accent glows
- "Desempenho dos Produtos" — goal-relative horizontal performance ranking
- Right-side summary cards (Top Produto, Crescimento, Estoque Crítico, Oportunidades)
- Monthly revenue by marketplace, connected marketplaces status
- Marketplace opportunities and intelligent alerts

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
```

## Production build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

## Deployment

Deploys as a static Vite SPA on **Vercel** (framework preset: Vite, output: `dist`). See `vercel.json`.
