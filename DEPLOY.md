# Instruções para Deploy no GitHub

## 1. Criar Repositório no GitHub

1. Acesse [GitHub](https://github.com)
2. Clique em "New repository" (ou vá em https://github.com/new)
3. Nome do repositório: `player-test` (ou o nome que preferir)
4. Deixe como **público** ou **privado** (sua escolha)
5. **NÃO** marque "Initialize with README" (já temos um)
6. Clique em "Create repository"

## 2. Conectar e Fazer Push

Após criar o repositório, execute os seguintes comandos no terminal:

```bash
# Adicionar o remote (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/player-test.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push do código
git push -u origin main
```

## 3. Deploy no Vercel

1. Acesse [Vercel](https://vercel.com)
2. Clique em "Add New Project"
3. Importe o repositório do GitHub
4. O Vercel detectará automaticamente as configurações
5. Clique em "Deploy"

**Pronto!** Seu projeto estará online! 🚀

