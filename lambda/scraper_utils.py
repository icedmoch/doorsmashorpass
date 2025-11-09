"""
Shared scraper utilities for UMass Dining Hall menus
Used by both Lambda function and backend scraper
"""
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import asyncio


async def get_available_dates(page, base_url):
    """Extract available dates from the dropdown menu"""
    print(f"Fetching available dates from {base_url}...")
    await page.goto(base_url, wait_until='networkidle')
    await page.wait_for_selector('#upcoming-foodpro', timeout=10000)
    
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
    """Parse menu data from HTML content"""
    soup = BeautifulSoup(html_content, 'html.parser')
    menu_data = {'date': date_str, 'location': location_name, 'meals': {}}
    
    meal_divs = soup.find_all('div', id=lambda x: x and '_menu' in x)
    
    for meal_div in meal_divs:
        meal_type = meal_div.get('id').replace('_menu', '')
        meal_header = meal_div.find('h2')
        meal_name = meal_header.get_text(strip=True) if meal_header else meal_type
        menu_data['meals'][meal_name] = {}
        
        content_div = meal_div.find('div', {'id': 'content_text'})
        if content_div:
            categories = content_div.find_all('h2', {'class': 'menu_category_name'})
            
            for category in categories:
                category_name = category.get_text(strip=True)
                menu_data['meals'][meal_name][category_name] = []
                current = category.find_next_sibling()
                
                while current:
                    if current.name == 'h2' and 'menu_category_name' in current.get('class', []):
                        break
                    
                    if current.name == 'li' and 'lightbox-nutrition' in current.get('class', []):
                        link = current.find('a')
                        if link:
                            item_data = {
                                'name': link.get_text(strip=True),
                                'nutrition': {
                                    'calories': link.get('data-calories', ''),
                                    'total_fat': link.get('data-total-fat', ''),
                                    'sodium': link.get('data-sodium', ''),
                                    'total_carb': link.get('data-total-carb', ''),
                                    'dietary_fiber': link.get('data-dietary-fiber', ''),
                                    'sugars': link.get('data-sugars', ''),
                                    'protein': link.get('data-protein', ''),
                                    'serving_size': link.get('data-serving-size', '')
                                }
                            }
                            menu_data['meals'][meal_name][category_name].append(item_data)
                    
                    current = current.find_next_sibling()
    
    return menu_data


async def get_all_menus_for_dining_hall(page, base_url, location_name):
    """Scrape menus for all available dates at one dining hall"""
    print(f"\nScraping menus for: {location_name}")
    
    try:
        available_dates = await get_available_dates(page, base_url)
        if not available_dates:
            print(f"No dates found for {location_name}")
            return []
        
        hall_menus = []
        for i, (date_value, date_text) in enumerate(available_dates, 1):
            print(f"Processing {i}/{len(available_dates)}: {date_text}")
            await page.select_option('#upcoming-foodpro', value=date_value)
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(1)
            html_content = await page.content()
            menu_data = parse_menu_from_html(html_content, date_text, location_name)
            if menu_data:
                hall_menus.append(menu_data)
            await asyncio.sleep(1)
        
        return hall_menus
    except Exception as e:
        print(f"Error scraping {location_name}: {e}")
        return []


async def scrape_all_dining_halls():
    """Scrape all dining hall menus"""
    dining_halls = {
        "Berkshire": "https://umassdining.com/menu/berkshire-grab-n-go-menu",
        "Worcester": "https://umassdining.com/menu/worcester-grab-n-go",
        "Franklin": "https://umassdining.com/menu/franklin-grab-n-go",
        "Hampshire": "https://umassdining.com/menu/hampshire-grab-n-go"
    }
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        page = await browser.new_page()
        all_menus = {}
        
        try:
            for hall_name, hall_url in dining_halls.items():
                menus = await get_all_menus_for_dining_hall(page, hall_url, hall_name)
                all_menus[hall_name] = menus
            return all_menus
        finally:
            await browser.close()
