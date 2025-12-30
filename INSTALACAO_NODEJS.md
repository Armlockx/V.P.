# 📥 Guia de Instalação do Node.js

## ✅ Recomendado: Instalador .msi (Windows Installer)

### Por que usar o .msi?
- ✅ Instalação automática
- ✅ Configura o PATH automaticamente
- ✅ Mais fácil e confiável
- ✅ Inclui npm automaticamente

### Passos para Instalação:

1. **Baixe o instalador:**
   - Na página do Node.js, clique em **"Windows Installer (.msi)"**
   - Baixe a versão LTS (v24.12.0 ou similar)
   - Arquivo será algo como: `node-v24.12.0-x64.msi`

2. **Execute o instalador:**
   - Clique duas vezes no arquivo `.msi` baixado
   - Clique em **"Next"** nas telas de instalação
   - Aceite os termos (se solicitado)
   - Mantenha as opções padrão (inclui npm e adiciona ao PATH)
   - Clique em **"Install"**
   - Aguarde a instalação concluir
   - Clique em **"Finish"**

3. **IMPORTANTE: Reinicie o terminal**
   - Feche completamente o terminal atual
   - Abra um novo terminal (PowerShell, CMD ou Git Bash)
   - Isso é necessário para carregar o PATH atualizado

4. **Verificar instalação:**
   ```bash
   node --version
   npm --version
   ```
   Deve mostrar algo como:
   ```
   v24.12.0
   11.6.2
   ```

5. **Agora você pode executar:**
   ```bash
   # Navegar até a pasta do projeto
   cd "C:\Users\julio.reus\Documents\Julio Inovacao 2025\2 - Sites\Julio\vp"
   
   # Instalar dependências
   npm install
   
   # Executar em desenvolvimento
   npm run dev
   ```

---

## ❌ Alternativa: Standalone Binary (.zip)

**Não recomendado** para iniciantes porque:
- ❌ Não configura o PATH automaticamente
- ❌ Requer configuração manual
- ❌ Mais complexo

Use apenas se souber configurar variáveis de ambiente manualmente.

---

## 🔍 Após Instalar

Se após instalar e reiniciar o terminal ainda não funcionar:

1. Verifique se o Node.js foi instalado:
   - Procure por "Node.js" no menu Iniciar
   - Se aparecer, a instalação foi bem-sucedida

2. Verifique o PATH manualmente:
   ```powershell
   $env:PATH -split ';' | Select-String -Pattern 'nodejs'
   ```
   Deve mostrar algo como: `C:\Program Files\nodejs\`

3. Se não aparecer, adicione manualmente:
   - Abra "Variáveis de Ambiente" no Windows
   - Adicione `C:\Program Files\nodejs\` ao PATH do sistema
   - Reinicie o terminal

---

## ✅ Próximos Passos Após Instalação

1. ✅ Node.js instalado
2. ✅ `.env.local` já criado
3. ⏳ Execute `npm install`
4. ⏳ Execute `npm run dev`
5. ⏳ Acesse http://localhost:3000

---

**Dica:** Se tiver dúvidas durante a instalação, mantenha as opções padrão do instalador.

