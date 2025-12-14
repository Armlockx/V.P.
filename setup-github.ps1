# Script para configurar o repositório GitHub
# Execute este script após criar o repositório no GitHub

Write-Host "=== Configuração do Repositório GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Solicitar informações do usuário
$githubUsername = Read-Host "Digite seu username do GitHub"
$repoName = Read-Host "Digite o nome do repositório (ou pressione Enter para 'player-test')"

if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "player-test"
}

$repoUrl = "https://github.com/$githubUsername/$repoName.git"

Write-Host ""
Write-Host "Configurando remote origin..." -ForegroundColor Yellow
git remote add origin $repoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Remote adicionado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠ Remote já existe ou houve um erro. Verificando..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
}

Write-Host ""
Write-Host "Renomeando branch para main..." -ForegroundColor Yellow
git branch -M main

Write-Host ""
Write-Host "Fazendo push para o GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Código enviado com sucesso para o GitHub!" -ForegroundColor Green
    Write-Host "Repositório: $repoUrl" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Erro ao fazer push. Verifique:" -ForegroundColor Red
    Write-Host "  1. Se o repositório foi criado no GitHub" -ForegroundColor Yellow
    Write-Host "  2. Se você tem permissões de escrita" -ForegroundColor Yellow
    Write-Host "  3. Se está autenticado no GitHub" -ForegroundColor Yellow
}

