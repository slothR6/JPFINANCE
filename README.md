# JPFINANCE — Controle financeiro pessoal

Aplicação web de controle financeiro **individual por usuário**. Cada pessoa
autentica com sua própria conta e acessa exclusivamente seus dados — receitas,
despesas, contas a pagar, dívidas, relatórios e configurações.

## Stack

- **Next.js 15** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS 3** com design tokens em CSS variables
- **Firebase** (Authentication + Firestore) com regras por UID
- **React Hook Form** + **Zod** para formulários
- **Recharts** para visualizações
- **date-fns** (pt-BR) e **lucide-react**

## Modelo de dados (individual)

```
firestore/
└── users/{uid}/
    ├── categories/{id}
    ├── incomes/{id}
    ├── expenses/{id}
    ├── bills/{id}
    ├── debts/{id}
    ├── debtPayments/{id}
    └── meta/preferences       (orçamento, meta de economia, perfil)
```

As regras (`firestore.rules`) só liberam leitura/escrita quando
`request.auth.uid == userId`. Não existe documento compartilhado.

## Estrutura

```
src/
├── app/
│   ├── (app)/                 # rotas autenticadas (app shell)
│   │   ├── dashboard/
│   │   ├── receitas/
│   │   ├── despesas/
│   │   ├── contas-a-pagar/
│   │   ├── dividas/
│   │   ├── relatorios/
│   │   └── configuracoes/
│   ├── login/                 # tela de entrar / criar conta
│   ├── globals.css            # design tokens + base
│   ├── layout.tsx             # fontes + providers
│   └── page.tsx               # redireciona para /dashboard
├── components/
│   ├── auth/                  # login-screen
│   ├── charts/                # trend-area, donut, category-bars
│   ├── forms/                 # drawers/modais de criação/edição
│   ├── layout/                # sidebar, topbar, mobile-nav, app-shell
│   ├── providers/             # auth, data, month, theme, toast
│   └── ui/                    # button, card, input, drawer, modal, etc
├── lib/                       # firebase, dates, finance, utils, constants
├── services/                  # repository (Firestore CRUD genérico)
└── types/                     # tipos do domínio
```

## Criar novos usuários

Cada pessoa cria sua própria conta pela tela de login
(aba **Criar conta**). No primeiro acesso, o sistema gera automaticamente:

- categorias padrão (receitas e despesas)
- documento de preferências (moeda BRL + tema do sistema)

Tudo isolado por `users/{uid}`.

