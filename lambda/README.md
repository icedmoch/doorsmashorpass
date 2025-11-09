# AWS Lambda Menu Scraper

## Recent Fixes

### Issue: Playwright Installation & Scraper Not Working
**Problem:** 
- `playwright: command not found` error in GitHub Actions
- Scraper code wasn't properly extracting menu data
- Missing `--upgrade` flag causing pip warnings

**Solution:**
1. **Imported working scraper logic** from `backend/scraper.py` into shared `scraper_utils.py`
2. **Fixed Playwright installation** command: `python -m playwright install chromium`
3. **Updated dining hall URLs** to use correct grab-n-go menu endpoints
4. **Added `--upgrade` flag** to pip install to prevent duplicate warnings
5. **Improved HTML parsing** to extract nutrition data from `data-*` attributes

---

# AWS Lambda Menu Scraper - Deployment Guide

## Overview

This Lambda function automatically scrapes UMass dining hall menus every Saturday at 11:00 AM EST and loads the data into your Supabase database. It uses:

- **AWS Lambda** - Serverless function execution
- **EventBridge** - Scheduled trigger (every Saturday at 11:00 AM EST)
- **CloudFormation** - Infrastructure as Code
- **GitHub Actions** - Automated deployment pipeline
- **Playwright** - Headless browser for web scraping
- **Supabase** - PostgreSQL database for data storage

## Architecture

```
GitHub Push (main branch)
    ↓
GitHub Actions Workflow
    ↓
Build Deployment Package (Playwright + Dependencies)
    ↓
Deploy CloudFormation Stack
    ↓
Update Lambda Function Code
    ↓
EventBridge Rule (Saturdays 11:00 AM EST)
    ↓
Lambda Execution (Scrape + Load to Supabase)
```

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with permissions to create:
   - Lambda functions
   - IAM roles
   - EventBridge rules
   - CloudWatch Logs
   - CloudFormation stacks

2. **Supabase Project** with:
   - `food_items` table created (see `calorie_tracker/init_database.sql`)
   - Service role key (for admin operations)

3. **GitHub Repository** with this code

## Step 1: Configure GitHub Secrets

GitHub Actions needs AWS and Supabase credentials to deploy. Add these secrets to your repository:

### Navigate to GitHub Secrets:
1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Required Secrets:

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for deployment | AWS IAM Console → Users → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | AWS IAM Console → Users → Security credentials |
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API → service_role (secret) |

### Creating AWS IAM User:

1. Go to AWS IAM Console → Users → Create user
2. Username: `github-actions-lambda-deploy`
3. Attach policies directly:
   - `AWSLambda_FullAccess`
   - `IAMFullAccess` (for role creation)
   - `CloudWatchLogsFullAccess`
   - `AmazonEventBridgeFullAccess`
   - `AWSCloudFormationFullAccess`
4. Create access key → Choose "Application running outside AWS"
5. Copy Access Key ID and Secret Access Key to GitHub Secrets

## Step 2: Deploy the Lambda Function

### Automatic Deployment (Recommended):

The Lambda function deploys automatically when you push changes to the `main` branch that affect:
- `lambda/**` files
- `.github/workflows/deploy-lambda.yml`

**To trigger deployment:**
```bash
git add lambda/
git commit -m "Deploy Lambda menu scraper"
git push origin main
```

### Manual Deployment:

You can also trigger deployment manually from GitHub:

1. Go to **Actions** tab in your GitHub repository
2. Click on **Deploy Menu Scraper Lambda** workflow
3. Click **Run workflow** → **Run workflow**

### Monitor Deployment:

1. Go to **Actions** tab
2. Click on the running workflow
3. Watch the steps execute:
   - ✅ Checkout code
   - ✅ Set up Python 3.12
   - ✅ Install dependencies (including Playwright)
   - ✅ Package Lambda function
   - ✅ Deploy CloudFormation stack
   - ✅ Update Lambda function code
   - ✅ Test Lambda function
   - ✅ Deployment summary

## Step 3: Verify Deployment

### Check AWS Console:

1. **Lambda Function:**
   - Go to AWS Lambda Console (us-east-1 region)
   - Find function: `umass-dining-menu-scraper-scraper`
   - Check configuration:
     - Runtime: Python 3.12
     - Memory: 2048 MB
     - Timeout: 15 minutes
     - Environment variables: `SUPABASE_URL`, `SUPABASE_KEY`

2. **EventBridge Rule:**
   - Go to Amazon EventBridge → Rules
   - Find rule: `umass-dining-menu-scraper-weekly-schedule`
   - Schedule: `cron(0 16 ? * SAT *)`
   - Status: Enabled ✓

3. **CloudWatch Logs:**
   - Go to CloudWatch → Log groups
   - Find: `/aws/lambda/umass-dining-menu-scraper-scraper`
   - Check recent executions

### Test Lambda Function Manually:

You can test the Lambda function without waiting for Saturday:

**Option 1: AWS Console**
1. Go to Lambda Console → Select function
2. Click **Test** tab
3. Create test event (use default JSON `{}`)
4. Click **Test**
5. Check execution results and logs

**Option 2: AWS CLI**
```bash
aws lambda invoke \
  --function-name umass-dining-menu-scraper-scraper \
  --payload '{"test": true}' \
  --region us-east-1 \
  response.json

cat response.json
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "body": {
    "message": "Menu scraping and database update completed successfully",
    "timestamp": "2025-11-08T...",
    "items_loaded": 740
  }
}
```

### Verify Supabase Data:

After Lambda execution, check your Supabase database:

1. Go to Supabase Dashboard → SQL Editor
2. Run query:
```sql
SELECT
  location,
  date,
  meal_type,
  COUNT(*) as item_count
FROM food_items
GROUP BY location, date, meal_type
ORDER BY date DESC, location, meal_type;
```

3. You should see data for all 4 dining halls (Berkshire, Worcester, Franklin, Hampshire) with latest menu dates

## Step 4: Monitor Weekly Executions

The Lambda function runs automatically every Saturday at 11:00 AM EST (16:00 UTC).

### Check Execution Status:

**CloudWatch Logs:**
1. Go to CloudWatch → Log groups → `/aws/lambda/umass-dining-menu-scraper-scraper`
2. Check logs for Saturday executions
3. Look for success message: "✅ Lambda execution completed successfully"

**Lambda Monitoring:**
1. Go to Lambda Console → Select function → **Monitor** tab
2. View metrics:
   - Invocations
   - Duration
   - Errors
   - Success rate

**EventBridge Monitoring:**
1. Go to EventBridge → Rules → Select rule
2. View **Metrics** tab for trigger history

## Troubleshooting

### Common Issues:

#### 1. Lambda Times Out (15 minutes exceeded)
**Symptom:** Function execution fails with timeout error

**Solutions:**
- Check network connectivity to UMass dining websites
- Verify Playwright browser installation succeeds
- Review CloudWatch Logs for specific scraping failures
- Consider increasing timeout in `cloudformation.yaml` (max 15 minutes)

#### 2. Playwright Installation Fails
**Symptom:** Error: "playwright command not found" or "Chromium not installed"

**Solutions:**
- Lambda installs Playwright on first run (`playwright install chromium`)
- Check ephemeral storage size (currently 2GB)
- Review CloudWatch Logs for installation errors
- Ensure `PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright` is set

#### 3. Supabase Connection Fails
**Symptom:** Error: "Failed to connect to Supabase" or "Invalid API key"

**Solutions:**
- Verify `SUPABASE_URL` and `SUPABASE_KEY` secrets are correct
- Check Supabase project is active (not paused)
- Ensure service role key is used (not anon key)
- Test connection from AWS CLI:
```bash
aws lambda invoke \
  --function-name umass-dining-menu-scraper-scraper \
  --log-type Tail \
  response.json
```

#### 4. GitHub Actions Deployment Fails
**Symptom:** Workflow fails at "Deploy CloudFormation stack" step

**Solutions:**
- Check AWS credentials in GitHub Secrets
- Verify IAM user has correct permissions
- Review GitHub Actions logs for specific error
- Ensure CloudFormation stack name is unique in your AWS account

#### 5. No Data Loaded to Supabase
**Symptom:** Lambda succeeds but `food_items` table is empty

**Solutions:**
- Check if UMass dining websites changed their HTML structure
- Review CloudWatch Logs for scraping errors
- Verify `food_items` table exists with correct schema
- Check for unique constraint violations (duplicate data)

### View Detailed Logs:

```bash
# Get recent logs
aws logs tail /aws/lambda/umass-dining-menu-scraper-scraper --follow

# Get logs for specific time range
aws logs filter-log-events \
  --log-group-name /aws/lambda/umass-dining-menu-scraper-scraper \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --end-time $(date +%s)000
```

## Cost Estimation

### AWS Lambda Costs (us-east-1):
- **Compute:** $0.0000166667 per GB-second
  - 2048 MB (2 GB) × 900 seconds (15 min max) × 4 executions/month
  - = 7,200 GB-seconds/month
  - = $0.12/month

- **Requests:** $0.20 per 1M requests
  - 4 requests/month (weekly execution)
  - = ~$0.00/month

- **Free Tier:** 400,000 GB-seconds + 1M requests per month (FREE)

**Estimated Monthly Cost: FREE** (covered by free tier)

### Other AWS Costs:
- **CloudWatch Logs:** $0.50 per GB ingested (minimal, ~0.01 GB/month)
- **EventBridge:** No charge for standard rules

**Total Estimated Monthly Cost: < $1.00**

## Updating the Lambda Function

### Update Lambda Code:

1. Modify `lambda/lambda_function.py` locally
2. Commit and push to main branch:
```bash
git add lambda/lambda_function.py
git commit -m "Update Lambda scraping logic"
git push origin main
```
3. GitHub Actions automatically deploys the update

### Update Lambda Configuration:

Modify `lambda/cloudformation.yaml`:
- Change timeout, memory, or environment variables
- Commit and push changes
- CloudFormation updates the stack automatically

### Update Schedule:

To change the EventBridge schedule, edit `lambda/cloudformation.yaml`:

```yaml
WeeklyScheduleRule:
  Type: AWS::Events::Rule
  Properties:
    # Change this cron expression
    # Format: cron(minute hour day-of-month month day-of-week year)
    ScheduleExpression: 'cron(0 16 ? * SAT *)'  # Saturday 11 AM EST
```

**Examples:**
- Daily at 8 AM EST: `cron(0 13 ? * * *)`
- Every Sunday at 9 AM EST: `cron(0 14 ? * SUN *)`
- Twice weekly (Wed, Sat) at 11 AM EST: `cron(0 16 ? * WED,SAT *)`

## Manual Cleanup

If you need to remove the Lambda function and all resources:

### Option 1: Delete CloudFormation Stack (Recommended)
```bash
aws cloudformation delete-stack \
  --stack-name umass-dining-menu-scraper \
  --region us-east-1
```

This deletes:
- Lambda function
- IAM role
- EventBridge rule
- CloudWatch Log group

### Option 2: Delete Resources Individually
```bash
# Delete Lambda function
aws lambda delete-function \
  --function-name umass-dining-menu-scraper-scraper \
  --region us-east-1

# Delete EventBridge rule
aws events remove-targets \
  --rule umass-dining-menu-scraper-weekly-schedule \
  --ids MenuScraperTarget \
  --region us-east-1

aws events delete-rule \
  --name umass-dining-menu-scraper-weekly-schedule \
  --region us-east-1

# Delete CloudWatch Log group
aws logs delete-log-group \
  --log-group-name /aws/lambda/umass-dining-menu-scraper-scraper \
  --region us-east-1
```

## Security Best Practices

1. **Rotate Credentials Regularly:**
   - Update AWS access keys every 90 days
   - Rotate Supabase service role key periodically

2. **Use Least Privilege IAM Policies:**
   - Grant only necessary permissions to IAM user
   - Consider using IAM roles for GitHub Actions (OIDC)

3. **Encrypt Sensitive Data:**
   - GitHub Secrets are encrypted at rest
   - Lambda environment variables are encrypted by default

4. **Monitor Lambda Execution:**
   - Set up CloudWatch Alarms for failures
   - Enable AWS CloudTrail for audit logging

5. **Network Security:**
   - Lambda runs in AWS-managed VPC (no public IP)
   - Consider using VPC if Supabase is in private network

## Advanced Configuration

### Add More Dining Halls:

Edit `lambda/lambda_function.py`:
```python
dining_halls = {
    "Worcester": "https://umassdining.com/locations-menus/worcester/menu",
    "Berkshire": "https://umassdining.com/locations-menus/berkshire/menu",
    "Franklin": "https://umassdining.com/locations-menus/franklin/menu",
    "Hampshire": "https://umassdining.com/locations-menus/hampshire/menu",
    # Add more here:
    "NewDiningHall": "https://umassdining.com/locations-menus/new-hall/menu"
}
```

### Enable CloudWatch Alarms:

```bash
# Create SNS topic for alerts
aws sns create-topic --name lambda-scraper-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:lambda-scraper-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create CloudWatch Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name lambda-scraper-errors \
  --alarm-description "Alert on Lambda scraper errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=umass-dining-menu-scraper-scraper \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:lambda-scraper-alerts
```

## Support

For issues or questions:
- Check CloudWatch Logs for detailed error messages
- Review GitHub Actions workflow logs
- Open an issue in the GitHub repository

## License

MIT License - See repository root for details
