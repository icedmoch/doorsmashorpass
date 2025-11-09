"""
Debug script to inspect scraped menu data structure
"""
import os
import sys
import json
import asyncio

# Add backend to path for .env loading
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables from backend/.env
from dotenv import load_dotenv
backend_env = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env)

from lambda_function import scrape_dining_hall

async def debug_scrape():
    """Scrape one dining hall and print detailed debug info"""
    print("Scraping Worcester dining hall...")

    menus = await scrape_dining_hall(
        "https://umassdining.com/locations-menus/worcester/menu",
        "Worcester"
    )

    print(f"\nFound {len(menus)} menu entries")

    for i, menu in enumerate(menus):
        print(f"\n{'='*60}")
        print(f"Entry {i+1}:")
        print(f"Date: {menu.get('date')}")
        print(f"Location: {menu.get('location')}")
        print(f"Meals: {list(menu.get('meals', {}).keys())}")

        meals = menu.get('meals', {})
        for meal_type, sections in meals.items():
            print(f"\n  {meal_type}:")
            for section_name, items in sections.items():
                print(f"    {section_name}: {len(items)} items")
                if items:
                    print(f"      First item: {items[0].get('name')}")
                    print(f"      Nutrition: {items[0].get('nutrition')}")

    # Save to JSON for inspection
    with open('debug_menu_output.json', 'w') as f:
        json.dump(menus, f, indent=2)

    print(f"\n\nFull menu data saved to debug_menu_output.json")

if __name__ == "__main__":
    asyncio.run(debug_scrape())
