# V.P. Player - Next.js Version

Player de vídeo estilo Netflix migrado para Next.js 14 com TypeScript e Supabase.

## 🚀 Funcionalidades Implementadas

- ✅ Player de vídeo estilo Netflix
- ✅ Controles automáticos (desaparecem após inatividade)
- ✅ Menu lateral com fila de vídeos
- ✅ Busca na fila de vídeos
- ✅ Sistema de autenticação (login/registro)
- ✅ Modo convidado (guest mode)
- ✅ Sistema de likes
- ✅ Sistema de comentários
- ✅ Painel administrativo completo
- ✅ Gerenciamento de vídeos e usuários
- ✅ Estatísticas de visualização
- ✅ Fullscreen
- ✅ Responsivo

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com) (para deploy)

## 🛠️ Instalação

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente:**
Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

3. **Executar em desenvolvimento:**
```bash
npm run dev
```

4. **Build para produção:**
```bash
npm run build
npm start
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Necessárias

#### `videos`
```sql
- id (UUID, primary key)
- title (TEXT)
- url (TEXT)
- thumbnail (TEXT, nullable)
- duration (TEXT, nullable)
- order_index (INTEGER, nullable)
- views (INTEGER, default 0)
- watch_time (INTEGER, default 0)
- user_id (UUID, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `profiles`
```sql
- id (UUID, primary key, references auth.users)
- username (TEXT)
- email (TEXT)
- avatar_url (TEXT, nullable)
- is_admin (BOOLEAN, default false)
- created_at (TIMESTAMP)
```

#### `video_likes` (opcional, para sistema de likes)
```sql
- id (UUID, primary key)
- video_id (UUID, references videos)
- user_id (UUID, references auth.users)
- created_at (TIMESTAMP)
```

#### `video_comments` (opcional, para sistema de comentários)
```sql
- id (UUID, primary key)
- video_id (UUID, references videos)
- user_id (UUID, references auth.users)
- content (TEXT)
- created_at (TIMESTAMP)
```

## 🚀 Deploy no Vercel

1. **Conectar repositório ao Vercel:**
   - Acesse [Vercel](https://vercel.com)
   - Importe seu repositório
   - O Vercel detectará automaticamente Next.js

2. **Configurar variáveis de ambiente:**
   - No painel do Vercel, vá em Settings > Environment Variables
   - Adicione:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Deploy:**
   - O Vercel fará deploy automaticamente
   - Ou execute `vercel` no terminal

## 📁 Estrutura do Projeto

```
vp-player/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout raiz
│   ├── page.tsx           # Página principal (player)
│   ├── admin/
│   │   └── page.tsx       # Painel admin
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── player/           # Componentes do player
│   ├── queue/            # Fila de vídeos
│   ├── auth/             # Autenticação
│   ├── admin/            # Painel admin
│   └── modals/           # Modais
├── lib/                  # Utilitários
│   ├── supabase/         # Clientes Supabase
│   ├── hooks/            # Custom hooks
│   └── utils/            # Funções utilitárias
├── types/                # Tipos TypeScript
└── public/               # Assets estáticos
```

## 🔐 Segurança

- ✅ Variáveis de ambiente para credenciais
- ✅ Row Level Security (RLS) no Supabase
- ✅ Verificação de permissões admin
- ✅ Validação de dados no cliente e servidor

## 🎨 Personalização

- Edite `app/globals.css` para estilos globais
- Modifique componentes em `components/`
- Ajuste hooks em `lib/hooks/`

## 📝 Notas Importantes

1. **Tabelas do Supabase:**
   - Certifique-se de criar todas as tabelas necessárias
   - Configure RLS (Row Level Security) adequadamente
   - Crie as funções RPC necessárias (`check_user_admin`, etc.)

2. **Storage do Supabase:**
   - Configure um bucket `avatars` para upload de avatares
   - Configure políticas de acesso adequadas

3. **Autenticação:**
   - O sistema suporta login, registro e modo convidado
   - Admin é verificado via RPC ou consulta direta à tabela `profiles`

## 🐛 Troubleshooting

### Erro ao conectar com Supabase
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o projeto Supabase está ativo

### Erro 404 nas rotas
- Certifique-se de que os arquivos estão em `app/` (não `pages/`)
- Verifique se está usando Next.js 14+

### Erro de tipos TypeScript
- Execute `npm install` novamente
- Verifique se `tsconfig.json` está correto

## 📄 Licença

MIT

## 🔄 Migração do Projeto Original

Este projeto foi migrado de HTML/CSS/JS vanilla para Next.js 14 com:
- TypeScript para type safety
- Componentes React modulares
- Hooks customizados
- App Router do Next.js
- Supabase SSR

---

**Desenvolvido com ❤️ usando Next.js e Supabase**


