# Script para fazer push para o GitHub
# Execute este script APÓS criar o repositório "V.P." no GitHub

Write-Host "=== Fazendo Push para GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se o remote está configurado
$remoteUrl = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Configurando remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/Armlockx/V.P..git
} else {
    Write-Host "Remote já configurado: $remoteUrl" -ForegroundColor Green
}

# Garantir que estamos na branch main
Write-Host "Verificando branch..." -ForegroundColor Yellow
git branch -M main

# Fazer push
Write-Host ""
Write-Host "Fazendo push para o GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Código enviado com sucesso!" -ForegroundColor Green
    Write-Host "Repositório: https://github.com/Armlockx/V.P." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Erro ao fazer push." -ForegroundColor Red
    Write-Host "Certifique-se de que:" -ForegroundColor Yellow
    Write-Host "  1. O repositório 'V.P.' foi criado no GitHub" -ForegroundColor Yellow
    Write-Host "  2. Você está autenticado no GitHub" -ForegroundColor Yellow
    Write-Host "  3. Você tem permissões de escrita no repositório" -ForegroundColor Yellow
}

