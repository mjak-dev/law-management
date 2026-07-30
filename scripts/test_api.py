#!/usr/bin/env python3
import urllib.request
import json
import sys

BASE_URL = "http://localhost:8080/api"

def test_endpoint(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    
    body = None
    if data:
        body = json.dumps(data).encode("utf-8")
    
    try:
        with urllib.request.urlopen(req, data=body, timeout=5) as response:
            status = response.status
            resp_body = response.read().decode("utf-8")
            print(f"[{method}] {path} -> SUCCESS (Status {status})")
            if resp_body:
                try:
                    return json.loads(resp_body)
                except:
                    return resp_body
            return None
    except Exception as e:
        print(f"[{method}] {path} -> FAILED: {e}")
        return None

def main():
    print("Starting Law Management API verification checks against localhost:8080...")
    
    # 1. Test Dashboard
    stats = test_endpoint("/dashboard")
    if stats:
        print(f"Stats returned: {json.dumps(stats, indent=2)}")
    
    # 2. Test Clients
    clients = test_endpoint("/clients")
    if clients and len(clients) > 0:
        print(f"Total seeded clients found: {len(clients)}")
        print(f"First client: {clients[0]['name']} ({clients[0]['email']})")

    # 3. Create a client
    new_client = {
        "name": "Alex Mercer",
        "email": "alex.mercer@example.com",
        "phone": "555-9081",
        "company": "Gentek Systems"
    }
    created = test_endpoint("/clients", method="POST", data=new_client)
    if created:
        print(f"Successfully created client: ID {created.get('id')}")

        # 4. Cleanup/Delete Client
        client_id = created.get("id")
        test_endpoint(f"/clients/{client_id}", method="DELETE")
        print("Cleanup: Deleted test client.")

    print("\nAPI Checks completed.")

if __name__ == "__main__":
    main()
