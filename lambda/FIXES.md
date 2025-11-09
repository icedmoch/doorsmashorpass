# Lambda Function Fixes

## Problems Identified

1. **Playwright Installation Error**
   - Error: `playwright: command not found`
   - Cause: Incorrect installation command in GitHub Actions workflow

2. **Scraper Not Working**
   - Wrong dining hall URLs (using `/locations-menus/` instead of `/menu/`)
   - Incorrect HTML parsing logic (looking for wrong CSS classes)
   - Missing nutrition data extraction from `data-*` attributes

3. **Pip Installation Warnings**
   - Multiple warnings about target directories already existing
   - Missing `--upgrade` flag in pip install command

## Solutions Implemented

### 1. Created Shared Scraper Module (`scraper_utils.py`)
- Extracted working scraper logic from `backend/scraper.py`
- Proper HTML parsing using BeautifulSoup
- Correct nutrition data extraction from `data-*` attributes
- Proper async/await handling with Playwright

### 2. Updated Lambda Function (`lambda_function.py`)
- Imports scraper from `scraper_utils.py`
- Fixed Playwright installation: `python -m playwright install chromium`
- Added mock context for local testing
- Simplified code by removing duplicate scraper logic

### 3. Fixed GitHub Actions Workflow (`.github/workflows/deploy-lambda.yml`)
- Added `--upgrade` flag to pip install
- Fixed Playwright installation command
- Included `scraper_utils.py` in deployment package
- Proper packaging of both Lambda function and utilities

### 4. Updated Dining Hall URLs
**Old (broken):**
```python
"Worcester": "https://umassdining.com/locations-menus/worcester/menu"
```

**New (working):**
```python
"Worcester": "https://umassdining.com/menu/worcester-grab-n-go"
```

### 5. Improved HTML Parsing
**Old approach:** Looking for `div.menu-block` and `button.menu-item`
**New approach:** Looking for `div[id*="_menu"]` and `li.lightbox-nutrition` with `data-*` attributes

## Testing

### Local Testing
```bash
cd lambda
python lambda_function.py
```

### Deploy to AWS
```bash
git add .
git commit -m "Fix Lambda scraper and Playwright installation"
git push origin main
```

The GitHub Actions workflow will automatically:
1. Install dependencies with `--upgrade` flag
2. Install Playwright chromium browser
3. Package Lambda function with scraper_utils.py
4. Deploy to AWS Lambda
5. Run a test invocation

## Key Files Modified

1. `lambda/lambda_function.py` - Simplified, imports from scraper_utils
2. `lambda/scraper_utils.py` - NEW: Shared scraper logic
3. `.github/workflows/deploy-lambda.yml` - Fixed installation and packaging
4. `lambda/README.md` - Added documentation about fixes

## Verification

After deployment, check CloudWatch Logs for:
- ✅ "Playwright Chromium installed successfully"
- ✅ "Found X available dates"
- ✅ "Successfully loaded X food items to Supabase"

If you see these messages, the scraper is working correctly!
