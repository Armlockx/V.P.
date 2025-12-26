# Instruções - Sistema de Administração

Este documento descreve como configurar e usar o sistema de administração do V.P. Player.

## 📋 Pré-requisitos

1. Execute o script SQL `admin_setup.sql` no SQL Editor do Supabase
2. Certifique-se de que a tabela `profiles` existe e tem o campo `admin`

## 🔧 Configuração Inicial

### 1. Executar Script SQL

Execute o arquivo `admin_setup.sql` no SQL Editor do Supabase. Este script irá:

- Adicionar a coluna `admin` (BOOLEAN) na tabela `profiles` se não existir
- Criar a função RPC `check_user_admin()` para verificar se um usuário é admin
- Criar a função RPC `get_user_profile()` para obter informações do perfil do usuário
- Configurar as permissões necessárias

### 2. Tornar um Usuário Admin

Para tornar um usuário administrador, execute o seguinte SQL no Supabase SQL Editor:

```sql
-- Substitua 'USER_ID_AQUI' pelo UUID do usuário que deseja tornar admin
UPDATE profiles 
SET admin = TRUE 
WHERE id = 'USER_ID_AQUI'::UUID;
```

**Como encontrar o ID do usuário:**
```sql
-- Listar todos os usuários com seus IDs
SELECT id, username, email, admin 
FROM profiles 
ORDER BY created_at DESC;
```

## 🎯 Funcionalidades do Painel Admin

O painel de administração (`admin.html`) oferece as seguintes funcionalidades:

### 1. Informações do Usuário
- Exibe o perfil do administrador logado
- Mostra avatar, username, email e status de admin

### 2. Gerenciamento de Vídeos
- Visualizar lista completa de vídeos
- Ver estatísticas de cada vídeo (views, tempo assistido, data de criação)
- Excluir vídeos selecionados
- Atualizar lista de vídeos

### 3. Gerenciamento de Usuários
- Visualizar lista completa de usuários
- Buscar usuários por username ou email
- Ver informações de cada usuário (avatar, username, email, data de criação)
- Verificar status de admin de cada usuário

### 4. Estatísticas Gerais
- Total de vídeos
- Total de visualizações
- Tempo total assistido
- Total de usuários
- Total de administradores

## 🔐 Segurança

### Verificação de Permissão

O sistema verifica se o usuário é admin em dois níveis:

1. **No cliente (JavaScript)**: O botão de admin só aparece para usuários com `admin = TRUE` na tabela `profiles`
2. **No servidor (RPC)**: A função `check_user_admin()` usa `SECURITY DEFINER` para verificar o status admin de forma segura

### Funções RPC de Segurança

- `check_user_admin()`: Retorna `TRUE` se o usuário autenticado é admin, `FALSE` caso contrário
- `get_user_profile()`: Retorna informações do perfil do usuário autenticado (incluindo status admin)

Ambas as funções usam `SECURITY DEFINER` para garantir que a verificação seja feita corretamente mesmo com RLS habilitado.

## 🚀 Como Usar

### Acessar o Painel Admin

1. Faça login na aplicação
2. Se você for um administrador, um botão com ícone de "escadas" (layers) aparecerá no canto superior esquerdo da tela
3. Clique no botão para acessar o painel de administração

### Gerenciar Vídeos

1. No painel admin, vá para a seção "Gerenciamento de Vídeos"
2. Clique em "Atualizar Lista" para recarregar os vídeos
3. Para excluir um vídeo:
   - Selecione o vídeo clicando no radio button
   - Clique em "Excluir Vídeo Selecionado"
   - Confirme a exclusão

### Gerenciar Usuários

1. No painel admin, vá para a seção "Gerenciamento de Usuários"
2. Use a barra de busca para filtrar usuários por username ou email
3. Clique em "Atualizar Lista" para recarregar os usuários

### Ver Estatísticas

1. No painel admin, vá para a seção "Estatísticas Gerais"
2. As estatísticas são atualizadas automaticamente ao carregar a página

## 📝 Notas Importantes

1. **Apenas usuários com `admin = TRUE` podem acessar o painel admin**
2. **O campo `admin` deve ser alterado apenas através do SQL Editor do Supabase** (por segurança)
3. **A exclusão de vídeos é permanente** - tenha cuidado ao usar esta funcionalidade
4. **O sistema verifica permissões tanto no cliente quanto no servidor** para garantir segurança

## 🔍 Troubleshooting

### Botão de Admin não aparece

1. Verifique se o usuário tem `admin = TRUE` na tabela `profiles`:
   ```sql
   SELECT id, username, admin FROM profiles WHERE id = 'SEU_USER_ID';
   ```

2. Verifique se a função RPC `check_user_admin()` foi criada corretamente:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'check_user_admin';
   ```

3. Verifique o console do navegador para erros JavaScript

### Erro ao acessar o painel admin

1. Certifique-se de estar logado
2. Verifique se o campo `admin` existe na tabela `profiles`:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'admin';
   ```

3. Verifique as permissões das funções RPC:
   ```sql
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_name IN ('check_user_admin', 'get_user_profile');
   ```

## 📁 Arquivos Relacionados

- `admin_setup.sql`: Script SQL para configurar o sistema de admin
- `admin.html`: Página do painel de administração
- `admin.js`: JavaScript do painel de administração
- `script.js`: Funções de verificação de admin no player principal
- `style.css`: Estilos do painel de administração

