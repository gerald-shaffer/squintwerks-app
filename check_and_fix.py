import firebase_admin
from firebase_admin import credentials, storage
import json

cred = credentials.Certificate('firebase-sa-key.json')
app = firebase_admin.initialize_app(cred, {'storageBucket': 'x-web-ar-platform.firebasestorage.app'})

bucket = storage.bucket()
blob = bucket.blob('experiences/the-kara-killam-rock-museum-sunshine-coast/index.html')
content = blob.download_as_text()

last_script_open = content.rfind('<script>')
last_script_close = content.rfind('</script>')
script = content[last_script_open+8:last_script_close]

print(f"Script length: {len(script)}")
print(f"Has launchCamera: {'launchCamera' in script}")
print(f"Has initAR: {'initAR' in script}")
print(f"Has waitForXR8: {'waitForXR8' in script}")
print(f"Has setupListeners: {'setupListeners' in script}")
print(f"Has XR8.XrController.configure: {'XR8.XrController.configure' in script}")

# Print functions found
import re
funcs = re.findall(r'(?:async )?function (\w+)', script)
print(f"\nFunctions defined: {funcs}")

# Check if the camera-screen has display:none (it starts hidden)
# The issue might be that launchCamera isn't switching screens
check = 'onclick="launchCamera()"' in content
print(f"\nHas onclick=launchCamera(): {check}")

# Check the button
btn_idx = content.find('OPEN CAMERA')
if btn_idx > 0:
    print(f"OPEN CAMERA button context: ...{content[btn_idx-80:btn_idx+20]}...")

# Print the actual script
print("\n=== SCRIPT CONTENT (first 3000 chars) ===")
print(script[:3000])
