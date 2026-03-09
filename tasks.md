# Fase 7 — Polish

## Tarefas (por prioridade)

- [x] **T1: Verificação visual** — Todas as páginas verificadas via Playwright. Sprites OK em home, decks, matchups, journal, training.
- [x] **T2: Mobile responsiveness** — Auditado em 375px. Fix: hide user deck name on mobile journal. Todas as páginas OK.
- [x] **T3: SEO** — Meta tags (title, description) adicionadas a 7 pages: home, decks, deck detail (dynamic), matchups, journal, training, coach.
- [x] **T4: Performance audit** — Bundle 1.5MB total JS, build 3s. Static pages com 1h revalidation. Remote image patterns OK. Sem issues críticos.
- [x] **T5: E2E test suite** — Playwright tests para fluxos: login, register, auth redirects, SEO. 9 tests passing (smoke + pages).

---

# Fase 8 — Feature Improvements

## Tarefas (por prioridade)

- [x] **T1: Info de fonte de dados na Tier List** — Adicionar um bloco informativo na tier list explicando de onde vêm os dados (fonte, metodologia, frequência de atualização).
- [x] **T2: Separar Stats do Journal** — Extrair a seção de estatísticas do Journal para uma aba dedicada `/stats`. Aprofundar as métricas e visualizações.
- [x] **T3: Quick Log como Dialog em Training** — Refatorar o Quick Log da página `/training` para abrir em um dialog modal, tornando o fluxo mais rápido e intuitivo.
- [x] **T4: Tipo de partida no log (plataforma)** — Adicionar campo no log para indicar se a partida é do TCG Masters, TCG Live ou física. Incluir esse campo nos filtros do Journal.
- [x] **T5: Integração TCG Masters Review** — Fazer o log interpretar arquivos de review do TCG Masters, identificar a partida e gerar um link direto para a review dentro do TCG Masters.
- [x] **T6: Visualização e edição de My Decks** — Permitir acessar e visualizar decks próprios com o mesmo layout dos outros decks. Adicionar funcionalidade de edição do deck.
