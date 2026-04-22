# JPFINANCE — Controle financeiro pessoal

Aplicação web de controle financeiro **individual por usuário**. Cada pessoa
autentica com sua própria conta e acessa exclusivamente seus dados — receitas,
despesas, contas a pagar, dívidas, relatórios e configurações. Nada é
compartilhado entre contas.

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

## Configuração

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   e habilite **Authentication** (provedor E-mail/senha) e **Firestore**.
2. Copie `.env.example` para `.env.local` e preencha com as chaves do projeto.
3. Publique as regras:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. Instale e rode:
   ```bash
   npm install
   npm run dev
   ```

## Criar novos usuários

Cada pessoa cria sua própria conta pela tela de login
(aba **Criar conta**). No primeiro acesso, o sistema gera automaticamente:

- categorias padrão (receitas e despesas)
- documento de preferências (moeda BRL + tema do sistema)

Tudo isolado por `users/{uid}`.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — inicia o build de produção
- `npm run lint` — lint com regras do Next.js

## Direção de design

Minimalismo SaaS com hierarquia de informação clara:

- Paleta neutra + um único brand (emerald)
- Tipografia: Inter (corpo) + Manrope (display)
- Cards com borda sutil, shadows discretas, respiros generosos
- Drawers laterais para criar/editar, modais para confirmações
- Tema claro/escuro/sistema

Este não é um CRUD genérico — é um produto pensado para transmitir
**clareza, controle e tranquilidade** no dia a dia.
