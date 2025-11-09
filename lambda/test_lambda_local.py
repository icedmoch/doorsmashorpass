"""
Test script to run the Lambda function locally with mock AWS context
"""
import os
import sys
from datetime import datetime

# Add backend to path for .env loading
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables from backend/.env
from dotenv import load_dotenv
backend_env = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env)

# Import the lambda function
from lambda_function import lambda_handler


class MockLambdaContext:
    """Mock AWS Lambda context for local testing"""
    def __init__(self):
        self.function_name = "test-umass-dining-menu-scraper"
        self.function_version = "$LATEST"
        self.invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:test-function"
        self.memory_limit_in_mb = 2048
        self.request_id = f"test-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.log_group_name = "/aws/lambda/test-function"
        self.log_stream_name = f"2025/01/08/[$LATEST]{self.request_id}"
        self._remaining_time_ms = 900000  # 15 minutes

    def get_remaining_time_in_millis(self):
        """Return mock remaining time"""
        return self._remaining_time_ms


def test_lambda_local():
    """Run the Lambda function locally"""
    print("="*80)
    print("Testing Lambda Function Locally")
    print("="*80)

    # Verify environment variables
    print("\nEnvironment Variables:")
    print(f"SUPABASE_URL: {os.environ.get('SUPABASE_URL', 'NOT SET')[:50]}...")
    print(f"SUPABASE_KEY: {'SET' if os.environ.get('SUPABASE_KEY') else 'NOT SET'}")

    # Create mock context
    context = MockLambdaContext()

    # Create test event (simulating EventBridge scheduled event)
    event = {
        "version": "0",
        "id": "test-event-id",
        "detail-type": "Scheduled Event",
        "source": "aws.events",
        "account": "123456789012",
        "time": datetime.now().isoformat(),
        "region": "us-east-1",
        "resources": [
            "arn:aws:events:us-east-1:123456789012:rule/test-rule"
        ],
        "detail": {}
    }

    print(f"\nInvoking Lambda function...")
    print(f"Request ID: {context.request_id}")
    print(f"Memory Limit: {context.memory_limit_in_mb}MB")
    print()

    # Run the Lambda function
    try:
        response = lambda_handler(event, context)

        print("\n" + "="*80)
        print("Lambda Response:")
        print("="*80)
        print(f"Status Code: {response['statusCode']}")

        import json
        body = json.loads(response['body'])
        print(f"\nResponse Body:")
        for key, value in body.items():
            print(f"  {key}: {value}")

        if response['statusCode'] == 200:
            print("\n[SUCCESS] Lambda function executed successfully!")
        else:
            print("\n[ERROR] Lambda function returned an error")

        return response

    except Exception as e:
        print(f"\n[ERROR] Error running Lambda function: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    test_lambda_local()
