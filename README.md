# ScopeMaster

Plataforma colaborativa para levantamento, gestão e validação de requisitos de software, desenvolvida como projeto integrador do curso de Análise e Desenvolvimento de Sistemas — SENAI Taubaté (2026).

## Equipe

- Ana Carolina Gonçalves
- Davi Marcondes Paes de Souza
- João Gabriel Floriano Olímpio
- João Pedro Fonseca Alves de Carvalho
- Lucca Castilho Costa
- Lucas Souza da Silva
- Miguel Oliveira de Almeida
- Pedro de Lima Cavalcanti

**Orientador:** Prof.º Wesley Fioreze

## Stack Tecnológico

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + Shadcn/UI + MUI
- **Backend:** Supabase BaaS (PostgreSQL + Auth + Row-Level Security)
- **Hospedagem:** Vercel

## Funcionalidades

- Cadastro e autenticação de usuários com três perfis (Administrador, Desenvolvedor, Cliente)
- Gestão completa de projetos (CRUD)
- Cadastro de requisitos funcionais e não funcionais com código único por projeto
- Fluxo de validação pelo cliente com aprovação/rejeição e feedback obrigatório
- Geração automática de documentação em PDF dos requisitos aprovados
- Dashboard com métricas e listagem de requisitos recentes
- Notificações em tempo real para o analista responsável

## Rodando localmente

### Pré-requisitos

- Node.js 18+ e npm
- Conta no [Supabase](https://supabase.com) com um projeto criado

### Passos

1. Clone o repositório:
   ```bash
   git clone https://github.com/luccalck/ScopeMaster.git
   cd ScopeMaster
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente — copie o arquivo de exemplo e preencha com as credenciais do seu projeto Supabase:
   ```bash
   cp .env.example .env
   ```

4. Execute os scripts SQL da pasta `Codigos do banco de dados/` no SQL Editor do Supabase, na seguinte ordem:
   - `Modelagem de Usuários e Projetos com Enums e RLS.txt`
   - `Tabela de Notificacoes.sql`
   - `add_feedback_validacao.sql`
   - `add_unique_codigo_requisito.sql`
   - `add_data_criacao_requisito.sql`
   - `Politicas de RLS para acesso anon.sql`
   - `Seed de usuários, projetos e requisitos.txt` *(opcional, popula dados de demo)*

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

   A aplicação abrirá em `http://localhost:5173` (ou na próxima porta disponível).

## Deploy no Vercel

1. Faça login no [Vercel](https://vercel.com) e clique em **New Project**.
2. Importe este repositório do GitHub.
3. O Vercel detectará automaticamente o framework Vite — não é necessário ajustar build commands.
4. Em **Environment Variables**, configure:
   - `VITE_SUPABASE_URL` — URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` — chave pública (anon) do Supabase
5. Clique em **Deploy**.

O `vercel.json` na raiz do projeto já define os rewrites necessários para que o React Router funcione corretamente em produção (todas as rotas são servidas pelo `index.html`).

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com hot-reload |
| `npm run build` | Gera o build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente para teste |

## Estrutura do projeto

```
.
├── src/
│   ├── app/
│   │   ├── components/    # Componentes reutilizáveis e Shadcn/UI
│   │   ├── screens/       # Telas (Login, Dashboard, Projects, etc.)
│   │   ├── lib/           # api.ts, supabase.ts, types.ts
│   │   └── App.tsx
│   ├── styles/            # CSS global e Tailwind
│   └── main.tsx           # Entry point
├── Codigos do banco de dados/  # Scripts SQL e modelagem do Supabase
├── public/                # Assets estáticos
├── .env.example           # Modelo de variáveis de ambiente
├── vercel.json            # Configuração de deploy no Vercel
└── vite.config.ts
```

## Documentação técnica

A Especificação de Requisitos do Software (ERS) completa, incluindo diagramas UML, regras de negócio, casos de teste e cronograma de Sprints, está disponível no documento `ERS_2026_ScopeMaster.pdf` (entregue separadamente no Google Classroom).

## Licença

Projeto acadêmico desenvolvido para fins educacionais — SENAI Taubaté, 2026.
