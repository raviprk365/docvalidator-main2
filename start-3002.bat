@echo off
echo Killing any process on port 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo Starting server on port 3002...
npm run dev -- --port 3002