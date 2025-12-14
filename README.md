# Player Netflix Style

Um player de vídeo moderno no estilo Netflix, integrado com Supabase para gerenciamento de vídeos.

## 🚀 Funcionalidades

- Player de vídeo estilo Netflix
- Controles automáticos que desaparecem após inatividade
- Menu lateral com fila de vídeos
- Busca na fila de vídeos
- Thumbnails dos vídeos
- Integração com Supabase para armazenamento de dados
- Responsivo e suporta fullscreen

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com) (opcional, para deploy)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd player-test
```

2. Configure o Supabase:
   - Crie um projeto no Supabase
   - Execute a migration para criar a tabela `videos`
   - Configure as políticas RLS conforme necessário

3. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env`
   - Preencha com suas credenciais do Supabase

## 🗄️ Estrutura do Banco de Dados

A tabela `videos` possui os seguintes campos:
- `id` (UUID): Identificador único
- `title` (TEXT): Título do vídeo
- `url` (TEXT): URL do vídeo
- `thumbnail` (TEXT): URL da thumbnail
- `duration` (TEXT): Duração do vídeo (formato "MM:SS")
- `order_index` (INTEGER): Ordem de exibição
- `created_at` (TIMESTAMP): Data de criação
- `updated_at` (TIMESTAMP): Data de atualização

## 🚀 Deploy no Vercel

1. Conecte seu repositório ao Vercel
2. O Vercel detectará automaticamente a configuração
3. Adicione as variáveis de ambiente no painel do Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## 📝 Adicionar Vídeos

Você pode adicionar vídeos diretamente no Supabase através do dashboard ou usando a API:

```javascript
// Exemplo de como adicionar um vídeo
const response = await fetch('https://seu-projeto.supabase.co/rest/v1/videos', {
  method: 'POST',
  headers: {
    'apikey': 'sua-chave',
    'Authorization': 'Bearer sua-chave',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Nome do Vídeo',
    url: 'https://url-do-video.mp4',
    thumbnail: 'https://url-da-thumbnail.jpg',
    duration: '10:30',
    order_index: 1
  })
});
```

## 🎨 Personalização

- Edite `style.css` para personalizar o visual
- Modifique `script.js` para adicionar funcionalidades
- Ajuste as políticas RLS no Supabase para controlar acesso

## 📄 Licença

MIT

