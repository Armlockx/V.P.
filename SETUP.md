# Instruções de Setup

## ⚠️ Pré-requisito: Node.js

Você precisa ter o Node.js instalado. Se não tiver:

1. Baixe em: https://nodejs.org/
2. Instale a versão LTS
3. Reinicie o terminal após instalar

## 📝 Passos de Configuração

### 1. Criar arquivo .env.local

Crie um arquivo chamado `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://esvjyjnyrmysvylnszjd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdmp5am55cm15c3Z5bG5zempkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzY2ODMsImV4cCI6MjA4MTMxMjY4M30.ZyEgF8y4cIdCPnlcfMOLt0fYMoZCJkXCdc6eqeF8xAA
```

**OU** copie o arquivo `env.local.example` para `.env.local`:
```powershell
Copy-Item env.local.example .env.local
```

### 2. Instalar dependências

Abra um terminal (PowerShell, CMD ou Git Bash) na pasta do projeto e execute:

```bash
npm install
```

### 3. Executar em desenvolvimento

```bash
npm run dev
```

O servidor iniciará em: http://localhost:3000

## 🔍 Verificar se Node.js está instalado

Execute no terminal:
```bash
node --version
npm --version
```

Se retornar erro, o Node.js não está instalado ou não está no PATH.

## 🐛 Problemas Comuns

### "npm não é reconhecido"
- Instale o Node.js: https://nodejs.org/
- Reinicie o terminal após instalar
- Verifique se está no PATH: `$env:PATH`

### "Erro ao conectar com Supabase"
- Verifique se o arquivo `.env.local` existe
- Confirme que as variáveis estão corretas
- Certifique-se de que não há espaços extras

### "Porta 3000 já em uso"
- Feche outros processos usando a porta 3000
- Ou use outra porta: `npm run dev -- -p 3001`

