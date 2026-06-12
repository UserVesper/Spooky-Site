from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import (NoSuchElementException, TimeoutException)
import random
import time
import json
from geopy.geocoders import GoogleV3
from dotenv import load_dotenv
import os
from time import perf_counter

start = perf_counter()
load_dotenv()  # Load environment variables from .env file

google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")


geolocator = GoogleV3(api_key=google_maps_api_key)

total = 0
total_with_coordinates = 0

def get_coordinates(location_name):
    location = geolocator.geocode(location_name)
    if location:  
        print("\n")  
        print(f"Location: {location_name}")
        print(f"Address: {location.address}")
        print(f"Latitude: {location.latitude}")
        print(f"Longitude: {location.longitude}")
        return({"latitude":location.latitude,"longitude":location.longitude,"address":location.address})
        
    else:
        print("\n")  
        print(f"Could not find coordinates for '{location_name}'")
        return None


def human_type(element, text, min_delay=0.05, max_delay=0.2):
    """Type text with random delays between keystrokes"""
    for character in text:
        element.send_keys(character)
        time.sleep(random.uniform(min_delay, max_delay))

def human_click(driver, element):
    """Simulate human-like click with mouse movement"""
    action = ActionChains(driver)
    action.move_to_element(element)
    action.pause(random.uniform(0.1, 0.3))
    action.click()
    action.perform()


# Initialize with options to make browser look more natural
options = webdriver.ChromeOptions()
options.add_argument("--disable-blink-features=AutomationControlled")
driver = webdriver.Chrome(options=options)

extracted_data = []
category_pages = []

driver.get("https://www.paranormaldatabase.com/reports/reports-type.html")
categories = driver.find_elements(By.CSS_SELECTOR, "div.w3-third")
for category in categories:
    category_pages.append({"name":str(category.get_attribute("innerText")), "url":str(category.find_element(By.TAG_NAME, "a").get_attribute("href"))})
categories = driver.find_elements(By.CSS_SELECTOR, "div.w3-quarter")
for category in categories:
    category_pages.append({"name":str(category.get_attribute("innerText")), "url":str(category.find_element(By.TAG_NAME, "a").get_attribute("href"))})
print(category_pages)
print("\n\n-------------------------------------------\n\n")

for category in category_pages:# 5. Output Results
    page_start = perf_counter()
    print(f"\n\nPage {category["name"]}")
    page_num = 0
    while(True):
        validPage = False
        driver.get(f'{category["url"]}?pageNum_paradata={page_num}')
        
        cards = driver.find_elements(By.CSS_SELECTOR, "div.w3-border-left.w3-border-top.w3-left-align")

        print(f"Page {page_num}: found {len(cards)} entries.")
        
        for card in cards:
            # try:
                card_info = str(card.get_attribute("innerText"))
                card_info = card_info.split("\n") 
                # print(card_info)
                
                if len(card_info) == 1:
                    continue
                if "Warning" in card_info[1]:
                    break
                if not card_info[0]:
                    card_info = card_info[3:]
                
                
                validPage = True
                try:
                    extracted_data.append({
                        "title":card_info[0],
                        "location_name":card_info[2].replace("Location: ",""),
                        "category":category["name"],
                        "type":card_info[3].replace("Type: ",""),
                        "datetime":card_info[4].replace("Date / Time: ",""),
                        "notes":card_info[5].replace("Further Comments: ",""), 
                    }|get_coordinates(card_info[2].replace("Location: ",""))) # type: ignore
                    total_with_coordinates +=1
                except:
                    pass
        
                # print(extracted_data[-1])
                # input("Press Enter")
                total+=1
            # except Exception as e:
            #     print("Error:", e)
            #     continue
                
            
        if not validPage:
            print(f'Finished {category["name"]} extraction')
            print(perf_counter()-page_start) 
            break
        
        page_num +=1 
        # for item in extracted_data:
        #     print(item)
                
        # input("Next?")
    
        
# # 5. Output Results
# print("\n--- Final Data ---")
# for item in extracted_data:
#     print(item)

with open("output.json", "w") as json_file:
    json.dump(extracted_data, json_file, indent=4)
    
print(f"Total:{total}\nTotal With Coordinates: {total_with_coordinates}")

print(perf_counter()-start)