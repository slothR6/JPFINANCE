# JPFINANCE — Controle Financeiro Doméstico

Aplicação web de controle financeiro para um lar compartilhado por duas pessoas. Centraliza receitas, despesas, contas a pagar, dívidas e relatórios em um único painel, com dados comuns a ambos os usuários.

## Stack

- **Next.js 15** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS 3** + `@tailwindcss/forms`
- **Firebase** (Authentication + Firestore)
- **React Hook Form** + **Zod** para formulários
- **Recharts** para gráficos
- **date-fns** / **lucide-react**

## Estrutura de pastas

```
src/
├── app/
│   ├── (protected)/        # Rotas autenticadas (dashboard, receitas, despesas, ...)
│   ├── login/              # Tela de login
│   └── layout.tsx          # Layout raiz com providers
├── components/
│   ├── auth/               # login-form, auth-guard
│   ├── providers/          # AuthProvider, ThemeProvider, HouseholdDataProvider
│   ├── charts/ forms/ layout/ ui/
├── hooks/                  # use-auth, use-household-data, use-month
├── lib/
│   └── firebase/client.ts  # Inicialização do Firebase no browser
├── services/
│   ├── auth-service.ts     # signIn / signOut
│   └── household-service.ts
└── types/
middleware.ts               # Proteção de rotas via cookie `finance-auth`
firestore.rules             # Regras do Firestore
```

## Pré-requisitos

- Node.js 18.18+ (recomendado 20+)
- Conta no [Firebase Console](https://console.firebase.google.com/) com um projeto criado

## Instalação

```bash
npm install
```

## Rodando localmente

```bash
npm run dev
```

Abra `http://localhost:3000`. Você será redirecionado para `/login`.

Outros scripts:

```bash
npm run build     # build de produção
npm run start     # roda a build em modo produção
npm run lint      # ESLint
```

## Configurando o `.env.local`

Crie um arquivo `.env.local` na raiz (já está no `.gitignore`) copiando o `.env.example`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:abcdef0123456789
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX   # opcional
NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID=casa-pedro
```

Todas as variáveis `NEXT_PUBLIC_FIREBASE_*` (exceto `MEASUREMENT_ID`) são **obrigatórias** — se faltar alguma, a tela mostra *“Firebase não configurado. Variáveis ausentes: …”*.

**Onde pegar os valores:** Firebase Console → ⚙️ *Project settings* → *General* → *Your apps* → web app → *SDK setup and configuration* → copie o objeto `firebaseConfig`.

> ⚠️ **Atenção ao `APP_ID`.** O valor tem exatamente este formato: `1:<messagingSenderId>:web:<hash>`. Se ele estiver duplicado, com múltiplos `:web:` ou prefixos extras, remova qualquer duplicação — senão o Firebase pode recusar a inicialização.

Depois de editar `.env.local`, **reinicie** `npm run dev` (Next.js só lê envs no start).

## Firebase — produtos usados

- **Authentication** (provedor Email/Senha)
- **Firestore** (dados do lar em `households/{householdId}`)

### 1. Habilitar Email/Senha

Firebase Console → *Authentication* → *Sign-in method* → **Email/Password** → *Enable* → *Save*.

Se esta etapa faltar, o login retorna `auth/operation-not-allowed` ou `auth/configuration-not-found`.

### 2. Criar usuário manualmente

Firebase Console → *Authentication* → aba *Users* → **Add user** → preencha email e senha (≥ 6 caracteres) → *Add user*.

O projeto **não** possui tela de cadastro: os usuários são criados manualmente.

### 3. Regras do Firestore

Publique o arquivo `firestore.rules` (Firebase Console → *Firestore Database* → *Rules*). Ele exige `request.auth != null` para acessar `households/{householdId}`.

## Testando o login

1. `npm run dev`
2. Acesse `http://localhost:3000/login`
3. Use um email/senha cadastrado manualmente no Firebase Authentication
4. Ao logar, um cookie `finance-auth=1` é definido e o `middleware.ts` libera as rotas protegidas (`/dashboard`, `/receitas`, etc.)

## Erros comuns

| Mensagem na tela | Causa provável | Como resolver |
|---|---|---|
| `Firebase não configurado. Variáveis ausentes: ...` | Falta variável em `.env.local` | Preencher todas as `NEXT_PUBLIC_FIREBASE_*` e **reiniciar** o dev server |
| `Email ou senha incorretos.` (`auth/invalid-credential`) | Usuário inexistente ou senha errada | Confirmar no console do Firebase; criar/redefinir senha |
| `Método Email/Senha não está habilitado...` (`auth/operation-not-allowed`) | Provedor desligado | Habilitar em *Authentication → Sign-in method* |
| `Chave de API do Firebase inválida.` (`auth/invalid-api-key`) | `API_KEY` errada ou `APP_ID` malformado | Recopiar o `firebaseConfig` do console |
| `Falha de rede ao contatar o Firebase.` | Sem internet / firewall / VPN | Testar conexão |
| `Muitas tentativas...` (`auth/too-many-requests`) | Lockout temporário | Aguardar alguns minutos |

## O que já está implementado

- Autenticação Email/Senha (login, logout, persistência local, sincronização de cookie)
- Proteção de rotas via `middleware.ts` + `AuthGuard`
- Providers: `ThemeProvider`, `AuthProvider`, `HouseholdDataProvider`
- Rotas protegidas: dashboard, receitas, despesas, contas a pagar, dívidas, relatórios, configurações
- Formulários validados com Zod + React Hook Form
- Gráficos (Recharts): donut por categoria, receita vs. despesa, evolução mensal
- Regras básicas do Firestore

## O que ainda não está

- Cadastro self-service de usuários (usuários são criados pelo Firebase Console)
- Recuperação de senha
- Testes automatizados
- Deploy configurado (Vercel / Firebase Hosting)
