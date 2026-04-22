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

As regras (`firestore.rules`) liberam leitura/escrita apenas para o dono do
path (`request.auth.uid == userId`) e validam campos, tipos mínimos e
referências internas ao mesmo usuário. Não existe documento compartilhado.

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

## Segurança / Hardening

### Middleware e cookie de sessão

O `middleware.ts` protege apenas a experiência de navegação: ele verifica o
cookie `jpf-session` para redirecionar rotas privadas para `/login` quando não
há marcador local. Esse cookie é criado pelo frontend, não é assinado, não é
`HttpOnly` e não deve ser tratado como sessão segura.

A proteção real dos dados vem de Firebase Authentication e das Firestore Rules.
Mesmo que alguém altere o cookie manualmente, o Firestore deve negar qualquer
leitura/escrita sem `request.auth.uid` válido.

O cookie usa:

- `Path=/`
- `SameSite=Lax`
- `Secure` automaticamente quando a aplicação roda em HTTPS

Uma sessão mais forte exigiria backend/API route com Firebase Admin SDK para
criar cookie de sessão assinado e `HttpOnly`. Isso não foi adicionado aqui para
não criar falsa sensação de segurança com um cookie client-side.

### Redirecionamento `next`

O parâmetro `next` do login passa por `safeInternalPath`. Só caminhos internos
iniciados por `/` são aceitos. Valores vazios, URLs externas, caminhos iniciados
por `//`, barras invertidas ou caracteres de controle caem para `/dashboard`.

### Firestore Rules

As rules restringem tudo ao path `users/{uid}` do usuário autenticado e negam
qualquer coleção desconhecida. Nas coleções principais, as escritas validam:

- campos permitidos com `hasOnly`
- campos mínimos com `hasAll`
- tipos e limites básicos
- referências sempre dentro do mesmo usuário, como `categoryId`, `creditCardId`
  e `debtId`
- `createdAt` como timestamp e sem alteração em updates

Antes de deploy, publique as rules:

```bash
firebase deploy --only firestore:rules
```

### App Check

O projeto está preparado para App Check no web SDK. Para ativar:

1. No Firebase Console, abra **App Check**.
2. Registre o app web com reCAPTCHA v3.
3. Copie a site key para `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_KEY`.
4. Em desenvolvimento, use `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=true`
   para gerar um debug token no console do navegador, registre esse token no
   Firebase Console e depois substitua `true` pelo token registrado.
5. Depois de validar em produção, habilite enforcement para Firestore no
   Firebase Console.

App Check reduz abuso vindo de clientes não reconhecidos, mas não substitui
Auth nem Firestore Rules. Não coloque segredos privados em variáveis
`NEXT_PUBLIC_*`.

### Validação de acesso entre usuários

Além das rules, o repositório cliente bloqueia chamadas acidentais quando o UID
informado não é o `auth().currentUser.uid` atual ou quando a coleção não é uma
das coleções esperadas. Essa checagem melhora segurança operacional e testes,
mas a barreira obrigatória continua sendo o Firestore.

### Testes manuais antes do deploy

- Crie usuário A e usuário B.
- Com A logado, crie uma categoria, receita, despesa, conta, dívida e cartão.
- Copie o UID de B e tente ler no Firestore Rules Playground ou em um script
  local autenticado com o token de A: `users/{uidB}` e subcoleções devem falhar
  com `permission-denied`.
- Ainda com token de A, tente escrever em `users/{uidB}/incomes/{id}`. Deve ser
  negado.
- Tente criar uma despesa de A com `categoryId` de B. Deve ser negado.
- Faça logout e acesse `/dashboard`. O app deve voltar para `/login` e não deve
  carregar dados.
- Acesse `/login?next=https://example.com`, `/login?next=//example.com` e
  `/login?next=abc`. Após login, deve ir para `/dashboard`.
- Acesse `/login?next=/receitas`. Após login, deve ir para `/receitas`.

## Criar novos usuários

Cada pessoa cria sua própria conta pela tela de login
(aba **Criar conta**). No primeiro acesso, o sistema gera automaticamente:

- categorias padrão (receitas e despesas)
- documento de preferências (moeda BRL + tema do sistema)

Tudo isolado por `users/{uid}`.

