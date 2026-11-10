@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Baixando os fasciculos da Cartilha de Seguranca para Internet (CERT.br)...
echo.
call :baixar "fasciculo-boatos.pdf" "https://cartilha.cert.br/fasciculos/boatos/fasciculo-boatos.pdf" "https://cartilha.cert.br/guardiao/fasciculo-boatos-egc.pdf"
call :baixar "fasciculo-redes-sociais.pdf" "https://cartilha.cert.br/fasciculos/redes-sociais/fasciculo-redes-sociais.pdf" "https://www.nic.br/media/docs/publicacoes/13/fasciculo-redes-sociais.pdf"
call :baixar "fasciculo-internet-segura.pdf" "https://cartilha.cert.br/fasciculos/internet-segura/fasciculo-internet-segura.pdf" "https://internetsegura.br/pdf/guia-internet-segura-pais.pdf"
echo.
echo Pronto. Se algum falhou, baixe pelo site: https://cartilha.cert.br/fasciculos/
pause
exit /b

:baixar
curl -fsSL -o "%~1" "%~2" && (echo OK   %~1) && exit /b
curl -fsSL -o "%~1" "%~3" && (echo OK   %~1 ^(link alternativo^)) && exit /b
echo FALHOU %~1
exit /b
