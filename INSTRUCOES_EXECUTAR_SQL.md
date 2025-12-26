# Instruções para Executar o Script SQL no Supabase

## Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione seu Projeto**
   - Escolha o projeto: `esvjyjnyrmysvylnszjd`

3. **Abra o SQL Editor**
   - No menu lateral, clique em **"SQL Editor"** (ícone de banco de dados)
   - Ou acesse diretamente: https://supabase.com/dashboard/project/esvjyjnyrmysvylnszjd/sql

4. **Cole o Script Completo**
   - Clique em **"New query"** ou use o editor existente
   - Copie TODO o conteúdo do arquivo `supabase_functions.sql`
   - Cole no editor SQL

5. **Execute o Script**
   - Clique no botão **"Run"** (ou pressione Ctrl+Enter)
   - Aguarde a execução completar

6. **Verifique se Funcionou**
   - Você deve ver mensagens de sucesso como:
     - "Success. No rows returned"
     - Ou mensagens confirmando a criação das funções e políticas

7. **Verificar se as Funções Foram Criadas** (Opcional)
   - Execute esta query no SQL Editor:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('increment_video_views', 'increment_video_watch_time');
   ```
   - Você deve ver 2 linhas retornadas com os nomes das funções

8. **Verificar Políticas RLS** (Opcional)
   - Execute esta query:
   ```sql
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN ('videos', 'video_likes', 'video_comments');
   ```
   - Você deve ver várias políticas listadas

## O que o Script Faz

1. **Cria Funções RPC** (bypass RLS):
   - `increment_video_views` - Incrementa views de vídeos
   - `increment_video_watch_time` - Incrementa watch_time de vídeos

2. **Configura Políticas RLS**:
   - Permite UPDATE em `videos` para todos (autenticados e anônimos)
   - Permite SELECT em `videos`, `video_likes`, `video_comments` para todos

3. **Garante Acesso para Guests**:
   - Funções RPC podem ser executadas por usuários anônimos
   - Políticas RLS permitem leitura de likes e comentários para guests

## Após Executar

- Recarregue a página do player
- Os erros de RLS devem desaparecer
- Watch_time deve começar a atualizar
- Likes e comentários devem aparecer para guests


