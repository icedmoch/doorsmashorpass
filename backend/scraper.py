from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import json
import asyncio


async def get_available_dates(page, base_url):
    """
    Extract available dates from the dropdown menu
    
    Args:
        page: Playwright page object
        base_url: Base URL of the menu page
        
    Returns:
        list: List of tuples (date_value, date_text)
    """
    
    print(f"Fetching available dates from {base_url}...")
    await page.goto(base_url, wait_until='networkidle')
    
    # Wait for dropdown to load
    await page.wait_for_selector('#upcoming-foodpro', timeout=10000)
    
    # Extract all options from dropdown
    dates = await page.evaluate('''() => {
        const select = document.getElementById('upcoming-foodpro');
        const options = Array.from(select.options);
        return options.map(option => ({
            value: option.value,
            text: option.text
        }));
    }''')
    
    print(f"Found {len(dates)} available dates")
    return [(d['value'], d['text']) for d in dates]


def parse_menu_from_html(html_content, date_str, location_name):
    """
    Parse menu data from HTML content
    
    Args:
        html_content: HTML string
        date_str: Date string for the menu
        location_name: Name of the location
        
    Returns:
        dict: Menu data
    """
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Initialize result structure
    menu_data = {
        'date': date_str,
        'location': location_name,
        'meals': {}
    }
    
    # Extract location name from page (if available, overrides passed name)
    location_header = soup.select_one('.singlepage-content-padding h1')
    if location_header:
        detected_location = location_header.get_text(strip=True)
        if detected_location:
            menu_data['location'] = detected_location
    
    # Find all meal periods (breakfast, lunch, etc.)
    meal_divs = soup.find_all('div', id=lambda x: x and '_menu' in x)
    
    for meal_div in meal_divs:
        # Get meal type
        meal_type = meal_div.get('id').replace('_menu', '')
        meal_header = meal_div.find('h2')
        meal_name = meal_header.get_text(strip=True) if meal_header else meal_type
        
        menu_data['meals'][meal_name] = {}
        
        # Find the content div
        content_div = meal_div.find('div', {'id': 'content_text'})
        
        if content_div:
            # Find all category headers
            categories = content_div.find_all('h2', {'class': 'menu_category_name'})
            
            for category in categories:
                category_name = category.get_text(strip=True)
                menu_data['meals'][meal_name][category_name] = []
                
                # Find all items until the next category
                current = category.find_next_sibling()
                
                while current:
                    # Stop if we hit another category
                    if current.name == 'h2' and 'menu_category_name' in current.get('class', []):
                        break
                    
                    # Look for menu items
                    if current.name == 'li' and 'lightbox-nutrition' in current.get('class', []):
                        link = current.find('a')
                        if link:
                            item_data = {
                                'name': link.get_text(strip=True),
                                'nutrition': {
                                    'calories': link.get('data-calories', ''),
                                    'calories_from_fat': link.get('data-calories-from-fat', ''),
                                    'total_fat': link.get('data-total-fat', ''),
                                    'sat_fat': link.get('data-sat-fat', ''),
                                    'trans_fat': link.get('data-trans-fat', ''),
                                    'cholesterol': link.get('data-cholesterol', ''),
                                    'sodium': link.get('data-sodium', ''),
                                    'total_carb': link.get('data-total-carb', ''),
                                    'dietary_fiber': link.get('data-dietary-fiber', ''),
                                    'sugars': link.get('data-sugars', ''),
                                    'protein': link.get('data-protein', ''),
                                    'serving_size': link.get('data-serving-size', '')
                                },
                                'allergens': link.get('data-allergens', ''),
                                'diet': link.get('data-clean-diet-str', ''),
                                'carbon_rating': link.get('data-carbon-list', ''),
                                'healthfulness': link.get('data-healthfulness', ''),
                                'ingredients': link.get('data-ingredient-list', '')
                            }
                            
                            menu_data['meals'][meal_name][category_name].append(item_data)
                    
                    current = current.find_next_sibling()
    
    return menu_data


async def get_menu_for_date(page, date_value, date_text, location_name):
    """
    Get menu for a specific date by selecting it in the dropdown
    
    Args:
        page: Playwright page object
        date_value: Date value to select (e.g., "11/07/2025")
        date_text: Human-readable date text
        location_name: Name of the location
        
    Returns:
        dict: Menu data
    """
    
    print(f"Fetching menu for {date_text} at {location_name}...")
    
    try:
        # Select the dropdown option
        await page.select_option('#upcoming-foodpro', value=date_value)
        
        # Wait for content to load
        await page.wait_for_load_state('networkidle')
        
        # Additional delay to ensure content is rendered
        await asyncio.sleep(1)
        
        # Get the page source after content loads
        html_content = await page.content()
        
        # Parse the menu
        menu_data = parse_menu_from_html(html_content, date_text, location_name)
        
        return menu_data
        
    except Exception as e:
        print(f"Error fetching menu for {date_text} at {location_name}: {e}")
        return None


async def get_all_menus_for_dining_hall(page, base_url, location_name):
    """
    Scrape menus for all available dates at one dining hall
    
    Args:
        page: Playwright page object
        base_url: Base URL of the menu page
        location_name: Name of the location (for display)
        
    Returns:
        list: List of menu data dictionaries
    """
    
    print(f"\nScraping menus for: {location_name}")
    
    try:
        # Get available dates
        available_dates = await get_available_dates(page, base_url)
        
        if not available_dates:
            print(f"No dates found for {location_name}")
            return []
        
        hall_menus = []
        
        for i, (date_value, date_text) in enumerate(available_dates, 1):
            print(f"Processing {i}/{len(available_dates)}: {date_text}")
            
            menu_data = await get_menu_for_date(page, date_value, date_text, location_name)
            
            if menu_data:
                hall_menus.append(menu_data)
            
            # Small delay between requests
            await asyncio.sleep(1)
        
        return hall_menus
        
    except Exception as e:
        print(f"Error scraping {location_name}: {e}")
        return []


async def get_all_dining_hall_menus():
    """
    Scrape menus from all 4 dining halls
    
    Returns:
        dict: Dictionary with location names as keys and menu lists as values
    """
    
    dining_halls = {
        "Berkshire": "https://umassdining.com/menu/berkshire-grab-n-go-menu",
        "Worcester": "https://umassdining.com/menu/worcester-grab-n-go", 
        "Franklin": "https://umassdining.com/menu/franklin-grab-n-go",
        "Hampshire": "https://umassdining.com/menu/hampshire-grab-n-go"
    }
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        all_menus = {}
        
        try:
            for hall_name, hall_url in dining_halls.items():
                menus = await get_all_menus_for_dining_hall(page, hall_url, hall_name)
                all_menus[hall_name] = menus
            
            return all_menus
            
        finally:
            await browser.close()


def save_menus_to_json(menus, filename='all_dining_halls_menus.json'):
    """Save all scraped menu data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(menus, f, indent=2, ensure_ascii=False)
    print(f"Menu data saved to {filename}")


def print_summary(all_menus):
    """Print a summary of all scraped menus"""
    print(f"\n{'='*60}")
    print("OVERALL SUMMARY")
    print(f"{'='*60}")
    
    for hall_name, menus in all_menus.items():
        print(f"\n{hall_name}: {len(menus)} days")


async def main():
    print("UMass Dining Menu Scraper - All 4 Dining Halls")
    
    all_menus = await get_all_dining_hall_menus()
    
    if all_menus:
        print_summary(all_menus)
        save_menus_to_json(all_menus)
    else:
        print("No menus were scraped.")


# Example usage
if __name__ == "__main__":
    asyncio.run(main())