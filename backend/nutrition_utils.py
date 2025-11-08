"""
Nutrition Utilities
Data loading and menu parsing utilities
"""
import json
from typing import List, Dict
from nutrition_models import FoodItemCreate


def parse_nutrition_value(value: str) -> float:
    """Extract numeric value from nutrition string (e.g., '25.9g' -> 25.9)"""
    if not value:
        return 0.0
    # Remove units and convert to float
    numeric_str = ''.join(c for c in value if c.isdigit() or c == '.')
    try:
        return float(numeric_str) if numeric_str else 0.0
    except ValueError:
        return 0.0


def parse_dining_hall_menu(menu_data: dict, location: str) -> List[FoodItemCreate]:
    """
    Parse dining hall menu data from JSON structure
    
    Expected structure:
    {
        "date": "2025-11-08",
        "meals": {
            "Breakfast": {
                "Section Name": [
                    {
                        "name": "Food Item Name",
                        "nutrition": {
                            "calories": "406",
                            "protein": "17.9g",
                            "total_fat": "18.0g",
                            ...
                        }
                    }
                ]
            }
        }
    }
    """
    food_items = []
    
    date = menu_data.get("date", "")
    meals = menu_data.get("meals", {})
    
    # Process each meal type (Breakfast, Lunch, Dinner)
    for meal_type, meal_sections in meals.items():
        # Each meal type has sections (like "Grab n'Go Breakfast", "Entree", etc.)
        for section_name, items in meal_sections.items():
            for item in items:
                nutrition = item.get("nutrition", {})
                
                # Create FoodItem with the required nutritional fields
                food_item = FoodItemCreate(
                    name=item.get("name", "Unknown"),
                    serving_size=nutrition.get("serving_size", "1 serving"),
                    calories=int(parse_nutrition_value(nutrition.get("calories", "0"))),
                    total_fat=parse_nutrition_value(nutrition.get("total_fat", "0g")),
                    sodium=parse_nutrition_value(nutrition.get("sodium", "0mg")),
                    total_carb=parse_nutrition_value(nutrition.get("total_carb", "0g")),
                    dietary_fiber=parse_nutrition_value(nutrition.get("dietary_fiber", "0g")),
                    sugars=parse_nutrition_value(nutrition.get("sugars", "0g")),
                    protein=parse_nutrition_value(nutrition.get("protein", "0g")),
                    location=location,
                    date=date,
                    meal_type=meal_type
                )
                food_items.append(food_item)
    
    return food_items


def load_dining_hall_menus_from_json(json_data: dict) -> List[FoodItemCreate]:
    """
    Load food items from the complete dining hall menus JSON file
    
    Expected structure:
    {
        "Worcester Dining Commons": [
            {
                "date": "2025-11-08",
                "meals": { ... }
            }
        ],
        "Franklin Dining Commons": [ ... ]
    }
    
    Returns a list of FoodItemCreate objects
    """
    food_items = []
    
    # Iterate through each dining hall location
    for location, entries in json_data.items():
        for entry in entries:
            items = parse_dining_hall_menu(entry, location)
            food_items.extend(items)
    
    return food_items


def get_available_dates(json_data: dict) -> List[str]:
    """Get list of available dates from the JSON file"""
    dates = set()
    for location, entries in json_data.items():
        for entry in entries:
            date = entry.get("date", "")
            if date:
                dates.add(date)
    
    return sorted(list(dates))


def get_available_locations(json_data: dict) -> List[str]:
    """Get list of available dining hall locations from the JSON file"""
    return sorted(list(json_data.keys()))


def validate_menu_json(json_data: dict) -> tuple[bool, List[str]]:
    """
    Validate the structure of menu JSON data
    Returns (is_valid, list_of_errors)
    """
    errors = []
    
    if not isinstance(json_data, dict):
        errors.append("Root must be a dictionary with location names as keys")
        return False, errors
    
    for location, entries in json_data.items():
        if not isinstance(entries, list):
            errors.append(f"Location '{location}' must contain a list of menu entries")
            continue
        
        for idx, entry in enumerate(entries):
            if not isinstance(entry, dict):
                errors.append(f"Entry {idx} in '{location}' must be a dictionary")
                continue
            
            if "date" not in entry:
                errors.append(f"Entry {idx} in '{location}' missing 'date' field")
            
            if "meals" not in entry:
                errors.append(f"Entry {idx} in '{location}' missing 'meals' field")
            elif not isinstance(entry["meals"], dict):
                errors.append(f"Entry {idx} in '{location}' 'meals' must be a dictionary")
    
    return len(errors) == 0, errors
