# Playwright Installation Fix for AWS Lambda

## Problem
```
/opt/hostedtoolcache/Python/3.12.12/x64/bin/python: No module named playwright
```

## Root Cause
Playwright was installed to `package/` directory but the CLI wasn't accessible in PATH during GitHub Actions workflow.

## Solution

### 1. Install Playwright browsers into package directory
```bash
PLAYWRIGHT_BROWSERS_PATH=package/.browsers python -m playwright install chromium --with-deps
```

### 2. Bundle browsers in deployment package
The `.browsers/` directory is now included in the Lambda zip file.

### 3. Remove runtime installation
Lambda function no longer tries to install Playwright at runtime - browsers are pre-bundled.

## Key Changes

**`.github/workflows/deploy-lambda.yml`:**
- Set `PLAYWRIGHT_BROWSERS_PATH=package/.browsers` during installation
- Added `--with-deps` flag for system dependencies
- Include `.browsers/` directory in zip package

**`lambda_function.py`:**
- Removed subprocess call to install Playwright at runtime
- Browsers are now pre-installed in deployment package

## Result
✅ Playwright browsers bundled with Lambda deployment
✅ No runtime installation needed
✅ Faster Lambda cold starts
