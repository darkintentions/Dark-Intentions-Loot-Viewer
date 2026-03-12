# Wowhead Auto-Fetch Implementation Summary

## Overview
The WoW Loot Tracker application now includes an auto-fetch feature that automatically retrieves item data from Wowhead when a user enters an Item ID in the "Add Gear Points" section. This data is then automatically added to the loot table with comprehensive information about the item.

## Features Implemented

### 1. **Auto-Fetch Item Data from Wowhead**
When a user enters an Item ID in the Add Gear Points form and clicks away (on change event), the system automatically:
- Fetches the item data from Wowhead.com using a CORS proxy
- Extracts key information including:
  - **Item Name**: The full name of the item
  - **Armor Type**: Classification (Cloth, Leather, Mail, Plate)
  - **Gear Slot**: Where the item is equipped (Head, Neck, Shoulders, etc.)
  - **Instance**: The raid or dungeon where the item drops from
  - **Boss**: The specific boss that drops the item
- Caches the fetched data to avoid redundant requests

### 2. **Live Preview of Fetched Data**
After entering an Item ID, users see a preview box that displays:
- Loading status while fetching
- Successfully extracted item information with values
- Indicators for missing data (shown as "(not found)")
- Color-coded feedback on the input field:
  - **Green border**: Data successfully fetched
  - **Orange border**: Data partially fetched
  - **Red border**: Error during fetch

### 3. **Automatic Loot Table Population**
When the user clicks "Edit GP" to add the gear points:
1. The GP entry is created with the Wowhead link in the reason field
2. The item is automatically added to the loot table with:
   - **Player**: From the player dropdown
   - **Item**: The item name from Wowhead
   - **Armor Type**: Automatically populated from Wowhead
   - **Gear Slot**: Automatically populated from Wowhead
   - **Instance**: The raid/dungeon name from Wowhead
   - **Boss**: The boss that drops the item
   - **Date**: Current date (YYYY-MM-DD format)
   - **Response**: Set to "Manually Given"
   - **Note**: The reason field from the form
   - **Class**: Empty (not currently tracked, can be edited manually)

### 4. **Improved Data Extraction**
The implementation uses multiple regex patterns to handle different HTML structures on Wowhead:
- Extracts from page title
- Searches for item information in various HTML formats
- Looks for gear slot and armor type in table layouts
- Parses drop data to find boss and instance information
- Falls back gracefully if some data isn't found

## How to Use

### Step 1: Navigate to EPGP Tab
Click on the EPGP tab in the sidebar menu to access the Gear Points section.

### Step 2: Fill in the Form
1. **Player**: Select the player from the dropdown
2. **GP**: Enter the GP value
3. **Item ID**: Enter the Item ID number from the item's Wowhead URL (e.g., for https://www.wowhead.com/item=12345, enter 12345)
4. **Reason**: Optional note about why the item was awarded

### Step 3: Watch for Auto-Fetch
- Once you leave the Item ID field, the system automatically fetches data
- A preview box appears showing what was found
- Check the preview to ensure the data looks correct

### Step 4: Submit
- Click "Edit GP" to submit
- The GP entry is created
- The item is automatically added to the loot table with all available data

### Step 5: Review in Loot Tab
- Navigate to the Loot tab to verify the item was added correctly
- You can edit any fields manually if needed (e.g., boss name, instance name, armor type)

## Technical Details

### Functions Added

#### `fetchWowheadItemData(itemId)`
- **Purpose**: Fetches and parses item data from Wowhead
- **Parameters**: Item ID (number)
- **Returns**: Object with itemId, itemName, armorType, gearSlot, boss, instance, and url
- **Uses**: CORS proxy (allorigins.win) to bypass CORS restrictions
- **Caching**: Stores results to avoid repeated requests

#### `setupWowheadItemIdListener()`
- **Purpose**: Attaches event listeners to the Item ID input field
- **Triggers**: When the user leaves the Item ID field (change event)
- **Features**:
  - Shows loading indicator
  - Displays fetched data in preview
  - Provides visual feedback via border color and opacity

#### `addItemToLootTable(player, itemId, reason)`
- **Purpose**: Adds the fetched item data to the loot table
- **Parameters**: Player name, Item ID, and reason
- **Returns**: Boolean indicating success or failure
- **Called**: Automatically from addGearPoints() when an Item ID is present

#### Enhanced `addGearPoints()`
- **Modified**: Now calls addItemToLootTable() after adding GP
- **Behavior**: If an Item ID was provided, the item is automatically added to the loot table
- **Feedback**: Shows success message for both GP and loot table additions

### Data Structure
```javascript
{
  itemId: 12345,
  itemName: "Legendary Armor Piece",
  armorType: "Plate",
  gearSlot: "Chest",
  boss: "Boss Name",
  instance: "Raid Name",
  url: "https://www.wowhead.com/item=12345"
}
```

### Loot Record Structure
```javascript
{
  player: "PlayerName",
  item: "Item Name",
  boss: "Boss Name",
  response: "Manually Given",
  date: "2026-03-11",
  armor_type: "Plate",
  gear_slot: "Chest",
  class: null,
  instance: "Raid Name",
  note: "Optional reason"
}
```

## Error Handling

### Scenarios Handled
1. **Empty Item ID**: Preview is hidden, no fetch occurs
2. **Network Error**: Error message displayed in preview, user can still proceed
3. **Invalid Item ID**: Graceful fallback with minimal data
4. **Partial Data**: Some fields may be "(not found)" but the item can still be added
5. **Cache Hit**: Subsequent requests for the same item ID use cached data

### User Feedback
- **Loading**: "Fetching item data from Wowhead..."
- **Success**: Displays all found data, green border on input
- **Partial**: "(not found)" shown for missing fields, orange border
- **Error**: Shows error message, red border on input

## Limitations and Notes

### Known Limitations
1. **Class Information**: Not extracted from Wowhead (player class not available in item page)
   - Users can manually edit the loot table to add this if needed
   - Class information should be added to player profiles in a future update

2. **HTML Parsing**: Wowhead's page structure can vary
   - Some specialized items may not have all data extracted
   - Boss/instance information may be missing for older items or non-raid gear

3. **CORS Proxy**: Relies on external service (allorigins.win)
   - Subject to rate limiting and service availability
   - Could be replaced with a custom backend endpoint for reliability

4. **Data Accuracy**: Extracted data is from Wowhead but may not be 100% accurate
   - Users should verify important information in the loot table
   - Manual editing is available for corrections

### Future Improvements
1. Create a custom backend endpoint for Wowhead scraping (more reliable)
2. Add player class tracking to the roster
3. Improve boss/instance extraction using WoW API instead of HTML parsing
4. Add ability to manually correct fetched data before submission
5. Add batch item import feature for multiple items

## Testing Checklist

- [ ] Enter a valid WoW item ID and verify data is fetched
- [ ] Verify preview shows item name and other extracted data
- [ ] Confirm item is added to loot table after clicking "Edit GP"
- [ ] Check loot table displays all populated fields correctly
- [ ] Test with multiple different item IDs
- [ ] Verify error handling when item ID is invalid
- [ ] Confirm cache works for repeated item IDs
- [ ] Test form clearing after submission
- [ ] Verify roster GP totals update correctly

## Summary

This implementation provides users with a streamlined workflow for tracking loot distribution:
1. Simply enter an item ID
2. System fetches the item data automatically
3. User reviews the preview
4. One click adds both the GP entry and the loot record
5. All data is saved and visible in the loot table

The feature significantly reduces manual data entry and improves consistency in loot tracking for WoW raiding groups using this EPGP system.
