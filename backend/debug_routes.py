from main import app

print("\n" + "="*50)
print("  🔍  API ROUTING TABLE  🔍")
print("="*50)

found_auth = False
for route in app.routes:
    if hasattr(route, "path"):
        methods = ", ".join(route.methods)
        print(f"  👉 {methods:<20} {route.path}")
        if "register" in route.path or "signup" in route.path:
            found_auth = True

print("="*50 + "\n")

if not found_auth:
    print("❌ WARNING: No 'register' or 'signup' route found!")
    print("   Check 'routers/auth.py' and 'main.py' to ensure the router is included.\n")

