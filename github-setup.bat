@echo off
chcp 65001 >nul
echo.
echo ========================================
echo GitHub Repository Setup
echo ========================================
echo.

set REPO_NAME=translateWeb
echo Repository name: %REPO_NAME%
echo.

REM Check if remote exists
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo Remote repository already exists.
    git remote get-url origin
    echo.
    set /p REMOVE="Remove and reset? (y/n): "
    if /i "%REMOVE%"=="y" (
        git remote remove origin
        echo Remote removed.
    )
)

REM Check if remote exists after potential removal
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Please provide your GitHub username:
    set /p USERNAME="GitHub username: "
    if "%USERNAME%"=="" (
        echo Error: Username cannot be empty
        exit /b 1
    )
    echo.
    echo Adding remote repository...
    git remote add origin https://github.com/%USERNAME%/%REPO_NAME%.git
    echo Remote added: https://github.com/%USERNAME%/%REPO_NAME%.git
)

REM Rename branch to main
git branch --show-current | findstr /C:"main" >nul
if %errorlevel% neq 0 (
    echo.
    echo Renaming branch to main...
    git branch -M main
)

REM Check for uncommitted changes
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo Uncommitted changes detected, adding...
    git add .
    git commit -m "Update: prepare for GitHub push"
)

REM Push to GitHub
echo.
echo Pushing to GitHub...
echo Note: If prompted for password, use Personal Access Token
echo Get Token: https://github.com/settings/tokens
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo Success! Code pushed to GitHub
    git remote get-url origin
) else (
    echo.
    echo Push failed. Please check:
    echo 1. Repository '%REPO_NAME%' exists on GitHub
    echo 2. GitHub username is correct
    echo 3. Personal Access Token is correct
    echo.
    echo Create repository: https://github.com/new
)

pause

