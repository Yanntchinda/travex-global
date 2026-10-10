@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
REM ============================================================
REM  TRAVEX GLOBAL - CREATION DE L'APK (Windows, version finale)
REM ------------------------------------------------------------
REM  Le projet est DEJA lie au compte Expo (projectId dans app.json).
REM  Ce script verifie Node, installe les dependances et EAS,
REM  puis compile l'APK Android dans le cloud Expo.
REM  Resultat : un lien de telechargement .apk installable.
REM
REM  UTILISATION : double-clique sur build-apk.bat
REM ============================================================

echo.
echo  ==========================================================
echo   TRAVEX GLOBAL  -  Generation de l'APK (Windows)
echo  ==========================================================
echo.

REM ---------- Vérifier Node.js ----------
set "NODEMAJOR=0"
where node >nul 2>nul
if errorlevel 1 goto installnode
for /f "tokens=1 delims=." %%a in ('node -v 2^>nul') do set "NODEMAJOR=%%a"
set "NODEMAJOR=!NODEMAJOR:v=!"
echo [OK] Node.js detecte - version majeure : !NODEMAJOR!
if !NODEMAJOR! LSS 18 goto installnode
goto havenode

:installnode
echo.
echo  -----------------------------------------------------------
echo   [ACTION]  Node.js est manquant ou trop ancien.
echo   1. Un navigateur va s'ouvrir sur https://nodejs.org
echo   2. Clique sur le bouton VERT "LTS"
echo   3. Ouvre le .msi telecharge -> Suivant -> Installer -> Terminer
echo   4. REVIENS ici et appuie sur ENTREE.
echo  -----------------------------------------------------------
echo.
start "" https://nodejs.org
pause >nul
for /f "tokens=2,*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%B"
if defined SYS_PATH set "PATH=%PATH%;%SYS_PATH%"
where node >nul 2>nul
if errorlevel 1 ( echo [ERREUR] Node pas trouve. Ferme puis relance. & pause & exit /b 1 )
echo [OK] Node detecte apres installation.
goto havenode

:havenode
echo [OK] npm :
call npm -v
echo.

REM ---------- Dependencies ----------
echo [INFO] Installation des dependances du projet ^(npm install^)...
call npm install
if errorlevel 1 ( echo [ERREUR] Echec de npm install. & pause & exit /b 1 )
echo [OK] Dependances installees.
echo.

REM ---------- EAS ----------
echo [INFO] Installation de l'outil EAS ^(eas-cli^)...
call npm install -g eas-cli
echo [OK] EAS installe.
echo.

REM ---------- Connexion Expo ----------
echo [INFO] Verification de la connexion Expo...
call eas whoami >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Deja connecte.
) else (
    echo [INFO] Un navigateur va s'ouvrir pour te connecter (gratuit, via Google).
    call eas login
    echo [OK] Connexion effectuee.
)
echo.

REM ---------- Liaison (deja faite via projectId) ----------
echo [INFO] Projet deja lie au compte ^(projectId dans app.json^).
echo.

REM ---------- Build APK ----------
echo.
echo ==========================================================
echo   Compilation de l'APK dans le cloud ^(5 a 10 minutes^)...
echo   Si EAS demande confirmation, reponds  y / Enter.
echo   ^(Keystore : reponds  y / Enter pour en generer un.^)
echo ==========================================================
echo.
call eas build -p android --profile preview

echo.
echo ==========================================================
echo   [OK] BUILD TERMINE !  TON APK EST PRET.
echo   1) Copie le LIEN affiche ci-dessus.
echo   2) Ouvre-le - telecharge le fichier .apk
echo   3) Envoie-le sur ton telephone ^(WhatsApp / cable / cloud^)
echo   4) Ouvre le .apk - "Installer"
echo ==========================================================
pause
