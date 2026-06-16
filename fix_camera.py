import firebase_admin
from firebase_admin import credentials, storage

# Init
if not firebase_admin._apps:
    cred = credentials.Certificate('firebase-sa-key.json')
    app = firebase_admin.initialize_app(cred, {'storageBucket': 'x-web-ar-platform.firebasestorage.app'})

bucket = storage.bucket()
blob = bucket.blob('experiences/the-kara-killam-rock-museum-sunshine-coast/index.html')
content = blob.download_as_text()

# The fix: Move the a-scene from the ar-container div into a <template> element.
# When launchCamera() is called, copy the template content into ar-container.
# This prevents A-Frame from auto-initializing in a display:none container.

# Find the a-scene HTML
scene_start = content.find('<a-scene')
scene_end = content.find('</a-scene>') + len('</a-scene>')
scene_html = content[scene_start:scene_end]

print(f"Scene HTML length: {len(scene_html)}")

# Replace the scene in ar-container with empty
content = content.replace(scene_html, '')

# Clean up whitespace in ar-container
content = content.replace('<div id="ar-container">\n      \n    </div>', '<div id="ar-container"></div>')
# Also try alternate whitespace patterns
content = content.replace('<div id="ar-container">\n        \n      </div>', '<div id="ar-container"></div>')

# Add a <template> element just before the inline script to store the scene
template_html = f'  <template id="ar-scene-template">{scene_html}</template>\n'
content = content.replace('  <script>\n    var ALL_TARGET_DATA', f'{template_html}  <script>\n    var ALL_TARGET_DATA')

# Update launchCamera to inject the scene from template BEFORE calling initAR
old_launch = """function launchCamera() {
      document.getElementById("launch-screen").classList.remove("active");
      document.getElementById("camera-screen").classList.add("active");
      initAR();
    }"""

new_launch = """function launchCamera() {
      document.getElementById("launch-screen").classList.remove("active");
      document.getElementById("camera-screen").classList.add("active");
      var template = document.getElementById("ar-scene-template");
      document.getElementById("ar-container").appendChild(template.content.cloneNode(true));
      initAR();
    }"""

if old_launch in content:
    content = content.replace(old_launch, new_launch)
    print("launchCamera updated successfully")
else:
    print("WARNING: Could not find launchCamera function to update!")
    # Try to find it
    idx = content.find('function launchCamera')
    if idx > 0:
        print(f"Found at position {idx}")
        print(repr(content[idx:idx+300]))

# Verify
has_template = 'ar-scene-template' in content
has_clone = 'cloneNode' in content
ar_empty = '<div id="ar-container"></div>' in content
print(f"Has template: {has_template}")
print(f"Has cloneNode: {has_clone}")
print(f"ar-container is empty: {ar_empty}")
print(f"Total length: {len(content)}")

if has_template and has_clone:
    # Upload
    blob.upload_from_string(content, content_type='text/html')
    print("\nUploaded fixed experience!")
else:
    print("\nERROR: Fix not applied correctly, not uploading.")
    # Save locally for inspection
    with open('/tmp/fixed_experience.html', 'w') as f:
        f.write(content)
    print("Saved to /tmp/fixed_experience.html for inspection")
