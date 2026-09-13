# push_to_github.ps1
# Run this after installing Git: Right-click → Run with PowerShell

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AI Legal Assistant - GitHub Push Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check Git ─────────────────────────────────────────────────────────
try {
    $gitVersion = git --version 2>&1
    Write-Host "[OK] $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Git is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Git:" -ForegroundColor Yellow
    Write-Host "  Option A (winget): winget install --id Git.Git -e"
    Write-Host "  Option B (direct): https://git-scm.com/download/win"
    Write-Host ""
    Write-Host "After installing, close this window and run the script again."
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location $root

# ── Step 2: Configure Git identity ───────────────────────────────────────────
$email = git config user.email 2>&1
if (-not $email -or $LASTEXITCODE -ne 0) {
    $email = Read-Host "Enter your GitHub email address"
    git config --global user.email $email
}
$name = git config user.name 2>&1
if (-not $name -or $LASTEXITCODE -ne 0) {
    $name = Read-Host "Enter your GitHub username"
    git config --global user.name $name
}
Write-Host "[OK] Git identity: $name <$email>" -ForegroundColor Green

# ── Step 3: Initialize repo ───────────────────────────────────────────────────
if (-not (Test-Path ".git")) {
    git init
    Write-Host "[OK] Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "[OK] Git repository already exists" -ForegroundColor Green
}

# ── Step 4: Verify .gitignore exists ─────────────────────────────────────────
if (-not (Test-Path ".gitignore")) {
    Write-Host "[WARN] .gitignore missing — creating one..." -ForegroundColor Yellow
    @"
node_modules/
dist/
.env
backend/.env
*.log
backend/data/bulk_*.json
backend/data/mega_bulk*.json
backend/data/final_bulk.json
backend/data/batch3.json
backend/data/embeddings.json
backend/uploads/
"@ | Set-Content ".gitignore"
}

# ── Step 5: Stage and commit ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[1] Staging all project files..." -ForegroundColor Cyan
git add .
$staged = git diff --cached --stat | Measure-Object -Line
Write-Host "[OK] $($staged.Lines) file(s) staged" -ForegroundColor Green

Write-Host ""
Write-Host "[2] Creating commit..." -ForegroundColor Cyan
$commitMsg = @"
Initial commit: AI Legal Assistant for Indian E-Courts

- AI chatbot with Google Gemini + advanced NLP pipeline
- 8325+ Indian law entries (IPC, BNS 2023, CrPC, BNSS 2023, +140 acts)
- NLP: Intent Classification, NER, BM25, Semantic Matching, RRF Fusion
- Case filing assistant, judgment summarizer, legal research
- Role-based dashboard: Citizen, Lawyer, Judge
- 17 Indian language support
"@
git commit -m $commitMsg
Write-Host "[OK] Commit created" -ForegroundColor Green

# ── Step 6: Get GitHub repo URL ───────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host " CREATE A GITHUB REPOSITORY FIRST" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open: https://github.com/new" -ForegroundColor White
Write-Host "2. Repository name: ai-legal-assistant" -ForegroundColor White
Write-Host "3. Choose Public or Private" -ForegroundColor White
Write-Host "4. Do NOT check any initialize options" -ForegroundColor White
Write-Host "5. Click 'Create repository'" -ForegroundColor White
Write-Host "6. Copy the URL (looks like: https://github.com/yourusername/ai-legal-assistant.git)" -ForegroundColor White
Write-Host ""

# Open GitHub in browser
$openBrowser = Read-Host "Open GitHub in browser now? (y/n)"
if ($openBrowser -eq "y") {
    Start-Process "https://github.com/new"
    Start-Sleep 2
}

$repoUrl = Read-Host "Paste your GitHub repository URL"
if (-not $repoUrl -or -not $repoUrl.EndsWith(".git")) {
    if (-not $repoUrl.EndsWith(".git")) { $repoUrl = $repoUrl.TrimEnd("/") + ".git" }
}

# ── Step 7: Push ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3] Setting remote origin..." -ForegroundColor Cyan
git remote remove origin 2>&1 | Out-Null
git remote add origin $repoUrl
git branch -M main

Write-Host ""
Write-Host "[4] Pushing to GitHub..." -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: If prompted for credentials:" -ForegroundColor Yellow
Write-Host "  - Username: your GitHub username" -ForegroundColor Yellow
Write-Host "  - Password: use a Personal Access Token (NOT your GitHub password)" -ForegroundColor Yellow
Write-Host "  - Create token: https://github.com/settings/tokens/new" -ForegroundColor Yellow
Write-Host "    (Select 'repo' scope, then generate and copy the token)" -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " SUCCESS! Project is on GitHub!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL: $($repoUrl -replace '\.git$','')" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Share this URL with your team or supervisor." -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "[ERROR] Push failed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Wrong URL — check you copied the .git URL correctly"
    Write-Host "  2. Authentication — use a Personal Access Token (not password)"
    Write-Host "     Generate token: https://github.com/settings/tokens/new"
    Write-Host "  3. Repo not created — go to https://github.com/new first"
}

Read-Host "`nPress Enter to exit"
