from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Going to http://localhost:3000/login")
            page.goto("http://localhost:3000/login", timeout=30000)
            print("Page loaded.")
            page.wait_for_selector("text=Crumb Toast", timeout=10000)
            print("Found 'Crumb Toast'.")
            title = page.title()
            print(f"Page title: {title}")
            assert "Crumb Toast" in title
            page.screenshot(path="verification.png")
            print("Verification successful.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
