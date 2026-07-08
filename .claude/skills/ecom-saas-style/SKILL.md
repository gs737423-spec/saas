
---
name: ecom-saas-style
description: Use this skill when designing or coding the e-commerce SaaS dashboard. It keeps the same dark premium Acelera dashboard aesthetic and focuses on marketplace, product, stock, finance and marketing intelligence.
---

# E-commerce SaaS Dashboard Style

This project is an independent subscription-based SaaS platform for e-commerce and marketplace intelligence.

It is not an internal company dashboard. Each client/business owner should be able to log in, import their own marketplace data, and monitor their operation across Mercado Livre, Shopee, Amazon, Magazine Luiza and their own online store.

## Visual style

Always follow the same aesthetic as the reference Acelera dashboard:

- Premium dark mode
- Deep navy/black background
- Large rounded KPI cards
- Glass-like panels
- Soft glow effects
- Subtle borders
- Modern bold typography
- Blue and cyan highlights
- Green for growth
- Yellow/orange for attention
- Red for critical alerts
- Purple/blue gradient buttons
- Strong visual hierarchy
- Clean spacing
- Information-rich but not overcrowded

The interface should feel like a high-end fintech/business intelligence SaaS product.

Avoid generic admin templates, plain dashboards, light themes, childish colors, excessive empty space or cluttered layouts.

## Navigation

Use top navigation as the main navigation:

- Visão Geral
- Marketplaces
- Produtos
- Estoque
- Financeiro
- Marketing
- Avaliações
- Importações
- Relatórios
- Configurações

A slim icon-only left rail may exist for shortcuts, but the main navigation should remain at the top.

## Main screens

Create and maintain these screens in the same style:

1. Visão Geral
2. Marketplaces
3. Produtos
4. Estoque
5. Financeiro
6. Marketing
7. Avaliações
8. Importações
9. Relatórios
10. Configurações

## Key e-commerce metrics

Use metrics related to e-commerce operations:

- Faturamento total
- Meta mensal
- Atingimento da meta
- Pedidos
- Ticket médio
- Taxa de conversão
- Estoque crítico
- Cobertura de estoque
- Produtos mais vendidos
- Produtos com menor giro
- Produtos em queda
- Margem por produto
- Faturamento por marketplace
- Comparativo Mercado Livre, Shopee, Amazon e loja própria
- Gasto em marketing
- ROAS
- CAC
- Taxas de marketplace
- Receita líquida
- Lucro estimado
- Reputação e avaliações
- Status das importações
- Alertas operacionais
- Oportunidades de crescimento

## Screen directions

### Overview

The overview should show the executive summary of the whole e-commerce operation.

Include:
- Faturamento
- Meta
- Atingimento
- Ticket médio
- Estoque crítico
- Gasto em marketing
- Top produto
- Desempenho dos produtos
- Faturamento mês a mês
- Marketplaces / oportunidades
- Alertas inteligentes

### Marketplaces

Show performance by sales channel.

Include:
- Revenue by marketplace
- Orders by marketplace
- Average ticket by marketplace
- Conversion by channel
- Reputation by marketplace
- Growth by channel
- Marketplace participation
- Opportunities and suggested actions

### Products

Show product intelligence.

Include:
- Active products
- Best-selling product
- Lowest rotation product
- Average margin
- Product performance table
- Top 5 products
- Category performance
- Sales, stock, margin and trend by SKU

### Stock

Show stock control and risk.

Include:
- Items in stock
- Critical stock
- Average coverage
- Stopped products
- Estimated rupture
- Stock by product
- Critical products
- Inventory turnover
- Stock recommendations

### Finance

Show financial health.

Include:
- Gross revenue
- Net revenue
- Marketplace fees
- Product costs
- Operating expenses
- Estimated profit
- Net margin
- Receivables by marketplace
- Cash cycle
- Break-even point
- Financial insights

### Marketing

Show campaign performance.

Include:
- Total investment
- ROAS
- CAC
- Attributed orders
- Generated revenue
- Cost per sale
- Investment vs revenue
- Performance by channel
- Top campaigns
- Investment distribution
- Opportunities and insights

### Imports

Show data import workflow.

Include:
- Cards for Mercado Livre, Shopee, Amazon and own store
- Upload file button
- Download template button
- Last import date
- Import status
- Import history
- Accepted formats
- Validation errors and warnings

## Responsive design rules

The entire SaaS interface must be fully responsive and adaptive across every screen size. Responsiveness is a hard requirement, not an afterthought — treat any layout that breaks, overflows, or becomes unreadable on a supported device as a bug.

### Core principles

- The platform must work well on large monitors, small notebooks, tablets and mobile phones.
- No chart, table, search bar, sidebar, card, header or button can break, overflow or become unreadable on any device.
- Avoid fixed widths that cause horizontal scroll. Prefer `min-w-0`, `max-w-*`, fluid/percentage widths and `minmax()` grid tracks over hardcoded pixel widths.
- Use responsive grids and breakpoints (Tailwind `sm md lg xl 2xl`) instead of single fixed layouts.
- Text must never overlap or collide. Use truncation (`truncate`), wrapping, or `min-w-0` on flex/grid children so long labels, product names and SKUs degrade gracefully.
- Cards must keep consistent spacing and a readable hierarchy at every width; scale padding and gaps down on smaller screens rather than letting content touch edges.
- The dashboard must preserve the premium dark Acelera aesthetic on every device — the mobile layout is a re-flow of the same design system, never a stripped-down or generic version.

### Component-specific rules

- **KPI cards** must reflow properly on smaller screens: 4 columns on desktop → 2 on tablet → 1 on small mobile, keeping glow, spacing and readable numbers.
- **Product ranking and tables** must become horizontally scrollable only inside their own card (wrap the table in an `overflow-x-auto` container with a sensible `min-w`), never breaking or scrolling the whole page.
- **Charts** must resize correctly and never overflow their containers. Always use responsive chart containers (e.g. Recharts `ResponsiveContainer` at `width="100%"`) and reserve height to avoid layout shift.
- **Sidebar** must adapt on mobile: collapse to icon-only, or switch to a hamburger/drawer or bottom navigation when horizontal space is scarce. It must never cover content or force horizontal scroll.
- **Top bar search** must shrink or hide gracefully on smaller screens (e.g. reduce width across breakpoints, then collapse to a search icon on mobile) without pushing other controls off-screen.
- **Import buttons, filters, profile menu and notifications** must remain accessible on all devices — condense to icons, move into an overflow/more menu, or wrap, but never disappear entirely.

### Breakpoints to test

Every screen must be verified at these widths, with no horizontal page overflow and no broken components at any of them:

- **≥1440px** — large desktop (full multi-column executive layout)
- **1280px** — notebook
- **1024px** — small laptop / tablet landscape
- **768px** — tablet (multi-column collapses toward 1–2 columns)
- **430px** — mobile
- **390px** — small mobile

### Verification checklist

- **Always take a real visual screenshot at 390px, not only DOM measurements.** `document.scrollWidth <= innerWidth` returning "no overflow" DOES NOT mean the layout is correct — content can still be cramped, clipped inside a scroll container, or a chart/tooltip/legend can overlap while the page reports no overflow. Look at every section with your eyes before claiming it works.
- No horizontal scroll on the page (`document.scrollWidth <= innerWidth`) at any breakpoint.
- Sidebar, top bar and all controls reachable and tappable (≥44px targets) on mobile.
- Tables/charts contained within their cards; only the card scrolls, not the page.
- Chart tooltips and legends must be compact and wrap on mobile (small `max-width`, `flex-wrap`) so they never cover the plot area.
- Reduce card padding on mobile (`p-4 sm:p-7`) so panels don't eat the narrow width.
- Inner card grids (marketplace tiles, sub-cards) collapse to 1 column on small mobile before they get cramped.
- No overlapping or clipped text; numbers and labels remain legible.
- Premium dark styling, spacing and glow intact on mobile.

## Working rules

Work one screen at a time.

Do not rewrite the entire project unless explicitly asked.

Reuse existing components, layout, colors, cards, charts and typography whenever possible.

Before editing, inspect only the files related to the requested page or component.

Avoid scanning the entire repository unless necessary.

When creating new pages, preserve the same design system and adapt only the content.

Prioritize a polished, premium, operational and visually impressive dashboard.
