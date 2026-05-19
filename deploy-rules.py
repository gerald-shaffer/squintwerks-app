import json
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

# Get access token from service account
creds = service_account.Credentials.from_service_account_file(
    'service-account.json',
    scopes=['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']
)
creds.refresh(Request())
token = creds.token
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# Storage rules content
rules = '''rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /experiences/{allPaths=**} {
      allow read, write: if true;
    }
    match /xweb-assets/{allPaths=**} {
      allow read, write: if true;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}'''

project = 'x-web-ar-platform'
bucket = 'x-web-ar-platform.firebasestorage.app'

# Step 1: Create a new ruleset
print("Creating ruleset...")
url = f'https://firebaserules.googleapis.com/v1/projects/{project}/rulesets'
payload = {
    'source': {
        'files': [{
            'content': rules,
            'name': 'storage.rules'
        }]
    }
}
resp = requests.post(url, json=payload, headers=headers)
print(f'  Status: {resp.status_code}')
print(f'  Response: {resp.text[:300]}')

if resp.status_code == 200:
    ruleset_name = resp.json()['name']
    print(f'  Ruleset: {ruleset_name}')
    
    # Step 2: Release the ruleset for storage
    print("\nReleasing ruleset for storage...")
    release_name = f'projects/{project}/releases/firebase.storage/{bucket}'
    release_url = f'https://firebaserules.googleapis.com/v1/{release_name}'
    release_payload = {'rulesetName': ruleset_name}
    
    # Try PATCH first (update existing release)
    resp2 = requests.patch(release_url, json=release_payload, headers=headers)
    print(f'  PATCH Status: {resp2.status_code}')
    print(f'  Response: {resp2.text[:300]}')
    
    if resp2.status_code != 200:
        # Try POST (create new release)
        print("\n  Trying POST instead...")
        create_url = f'https://firebaserules.googleapis.com/v1/projects/{project}/releases'
        create_payload = {
            'name': release_name,
            'rulesetName': ruleset_name
        }
        resp3 = requests.post(create_url, json=create_payload, headers=headers)
        print(f'  POST Status: {resp3.status_code}')
        print(f'  Response: {resp3.text[:300]}')
else:
    print("Failed to create ruleset")
