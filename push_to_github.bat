@echo off
echo ========================================
echo  AI Legal Assistant — GitHub Push Script
echo ========================================
echo.

:: Check Git
git --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed.
    echo.
    echo Please install Git first:
    echo   1. Go to: https://git-scm.com/download/win
    echo   2. Download and install Git for Windows
    echo   3. Restart Command Prompt / PowerShell
    echo   4. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Git found
git --version
echo.

:: Configure git (will prompt if not set)
git config user.email > nul 2>&1
if %errorlevel% neq 0 (
    set /p GIT_EMAIL="Enter your GitHub email: "
    git config --global user.email "%GIT_EMAIL%"
)

git config user.name > nul 2>&1
if %errorlevel% neq 0 (
    set /p GIT_NAME="Enter your GitHub username: "
    git config --global user.name "%GIT_NAME%"
)

:: Initialize git in project folder
echo [1] Initializing Git repository...
if not exist ".git" (
    git init
    echo Git initialized.
) else (
    echo Git already initialized.
)
echo.

:: Add .gitignore
echo [2] Creating .gitignore...
echo. > nul

:: Add all files
echo [3] Staging all files...
git add .
echo Files staged.
echo.

:: Commit
echo [4] Creating initial commit...
git commit -m "Initial commit: AI Legal Assistant for Indian E-Courts

Features:
- AI chatbot powered by Google Gemini with advanced NLP pipeline
- 8325+ Indian law entries (IPC, BNS 2023, CrPC, BNSS 2023, Constitution, +140 acts)
- Advanced NLP: Intent Classification + NER + BM25 + Semantic Matching + RRF
- Case filing assistant, judgment summarizer, legal research
- Role-based dashboard (Citizen, Lawyer, Judge)
- 17 Indian language support"
echo.

:: Ask for GitHub repo URL
echo [5] Connect to GitHub
echo.
echo Please create a NEW repository on GitHub first:
echo   1. Go to: https://github.com/new
echo   2. Repository name: ai-legal-assistant  (or any name)
echo   3. Set to Public or Private
echo   4. Do NOT initialize with README, .gitignore, or license
echo   5. Click "Create repository"
echo   6. Copy the repository URL (ends with .git)
echo.
set /p REPO_URL="Paste your GitHub repository URL here: "

:: Add remote and push
echo [6] Pushing to GitHub...
git branch -M main
git remote remove origin > nul 2>&1
git remote add origin %REPO_URL%

echo.
echo Pushing code to GitHub (this may ask for credentials)...
echo If prompted, use your GitHub username and a Personal Access Token (not password).
echo Get a token at: https://github.com/settings/tokens/new
echo   - Select: repo (full control)
echo.

git push -u origin main

if %errorlevel% eq 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Project pushed to GitHub!
    echo ========================================
    echo.
    echo Your repository: %REPO_URL%
    echo.
) else (
    echo.
    echo [ERROR] Push failed. Common fixes:
    echo   - Make sure you created the GitHub repo first
    echo   - Use a Personal Access Token, not your password
    echo   - Token needs 'repo' permission
    echo   - Get token: https://github.com/settings/tokens/new
)

pause
