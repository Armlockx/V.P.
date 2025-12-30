# Proposta de Implementação Next.js

## 📋 Checklist de Migração

### Fase 1: Setup Inicial ✅
- [x] Análise da estrutura atual
- [ ] Criar `package.json` com dependências Next.js
- [ ] Configurar `next.config.js`
- [ ] Configurar TypeScript (`tsconfig.json`)
- [ ] Configurar Tailwind CSS (opcional)
- [ ] Criar estrutura de diretórios

### Fase 2: Configuração Supabase
- [ ] Criar `lib/supabase/client.ts` (browser)
- [ ] Criar `lib/supabase/server.ts` (server)
- [ ] Migrar variáveis de ambiente
- [ ] Remover `config.js` hardcoded

### Fase 3: Componentes Base
- [ ] Layout principal (`app/layout.tsx`)
- [ ] Página do player (`app/page.tsx`)
- [ ] Componente `VideoPlayer`
- [ ] Componente `VideoControls`
- [ ] Componente `VideoQueue`

### Fase 4: Autenticação
- [ ] Hook `useAuth`
- [ ] Componente `AuthModal`
- [ ] Middleware de autenticação
- [ ] Proteção de rotas admin

### Fase 5: Funcionalidades do Player
- [ ] Sistema de fila
- [ ] Upload de vídeos
- [ ] Sistema de likes
- [ ] Sistema de comentários
- [ ] Estatísticas

### Fase 6: Painel Admin
- [ ] Página admin (`app/admin/page.tsx`)
- [ ] Componente `AdminDashboard`
- [ ] Gerenciamento de vídeos
- [ ] Gerenciamento de usuários

### Fase 7: Estilos
- [ ] Migrar estilos globais
- [ ] Converter para CSS Modules ou Tailwind
- [ ] Responsividade

### Fase 8: Deploy
- [ ] Configurar Vercel
- [ ] Variáveis de ambiente
- [ ] Testes de produção

---

## 🛠️ Arquivos de Configuração

### `package.json`
```json
{
  "name": "vp-player-nextjs",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/ssr": "^0.0.10"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['esvjyjnyrmysvylnszjd.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Headers para CORS (se necessário)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `.env.example`
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📝 Estrutura de Componentes Proposta

### 1. VideoPlayer Component
```typescript
// components/player/VideoPlayer.tsx
'use client';

import { useVideoPlayer } from '@/lib/hooks/useVideoPlayer';

export function VideoPlayer() {
  const {
    video,
    isPlaying,
    currentTime,
    duration,
    volume,
    // ... outros estados
  } = useVideoPlayer();

  return (
    <div className="player">
      <video ref={videoRef} />
      <VideoControls />
      <VideoLoader />
    </div>
  );
}
```

### 2. Custom Hook: useVideoPlayer
```typescript
// lib/hooks/useVideoPlayer.ts
'use client';

import { useState, useRef, useEffect } from 'react';

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // ... outros estados

  // Lógica do player
  // ...

  return {
    videoRef,
    isPlaying,
    // ... outros valores
  };
}
```

### 3. Supabase Client
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
```

---

## 🔄 Migração Passo a Passo

### Passo 1: Setup Base
1. Instalar Next.js: `npx create-next-app@latest`
2. Instalar dependências: `npm install @supabase/supabase-js @supabase/ssr`
3. Configurar TypeScript
4. Criar estrutura de diretórios

### Passo 2: Migrar Supabase
1. Criar `lib/supabase/client.ts`
2. Criar `lib/supabase/server.ts`
3. Remover `config.js` e `lib/supabase.js`
4. Configurar variáveis de ambiente

### Passo 3: Migrar Player
1. Criar componente `VideoPlayer`
2. Extrair lógica para `useVideoPlayer`
3. Migrar controles
4. Migrar loader

### Passo 4: Migrar Autenticação
1. Criar hook `useAuth`
2. Migrar modal de auth
3. Implementar middleware
4. Proteger rotas

### Passo 5: Migrar Admin
1. Criar página admin
2. Migrar componentes admin
3. Implementar verificação de permissões

### Passo 6: Estilos
1. Migrar CSS global
2. Converter para módulos ou Tailwind
3. Testar responsividade

### Passo 7: Deploy
1. Configurar Vercel
2. Adicionar variáveis de ambiente
3. Testar em produção

---

## ⚠️ Considerações Importantes

### 1. Client vs Server Components
- Player: `'use client'` (precisa de interatividade)
- Admin: `'use client'` (precisa de interatividade)
- Layout: Server Component (pode ser)
- API Routes: Server-side

### 2. Estado Global
- Considerar Context API ou Zustand
- Para estado do player
- Para estado de autenticação

### 3. Performance
- Lazy load de modais
- Code splitting automático
- Otimização de imagens

### 4. SEO
- Meta tags dinâmicas
- Open Graph
- Structured data

---

## 📊 Estimativa de Tempo

- Setup inicial: 2-3 horas
- Migração Supabase: 1-2 horas
- Componentes base: 4-6 horas
- Autenticação: 3-4 horas
- Funcionalidades: 6-8 horas
- Admin: 4-6 horas
- Estilos: 3-4 horas
- Testes e ajustes: 4-6 horas

**Total estimado: 27-39 horas**

---

## 🎯 Prioridades

1. **Alta Prioridade**
   - Setup Next.js
   - Configuração Supabase
   - Player básico funcionando
   - Autenticação

2. **Média Prioridade**
   - Funcionalidades do player
   - Painel admin
   - Estilos

3. **Baixa Prioridade**
   - Otimizações avançadas
   - Analytics
   - PWA

---

**Pronto para começar a implementação!** 🚀

