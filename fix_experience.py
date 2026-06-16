import firebase_admin
from firebase_admin import credentials, storage
import json
import re

# Initialize
if not firebase_admin._apps:
    cred = credentials.Certificate('firebase-sa-key.json')
    app = firebase_admin.initialize_app(cred, {
        'storageBucket': 'x-web-ar-platform.firebasestorage.app'
    })

bucket = storage.bucket()

# Download the current broken index.html to get the target data
blob = bucket.blob('experiences/the-kara-killam-rock-museum-sunshine-coast/index.html')
old_content = blob.download_as_text()

# Extract ALL_TARGET_DATA
td_match = re.search(r'var ALL_TARGET_DATA = (\[.*?\]);', old_content)
all_target_data = json.loads(td_match.group(1))
print(f"Found {len(all_target_data)} targets")

# Get video URLs from storage (using download tokens)
blobs_list = list(bucket.list_blobs(prefix='experiences/the-kara-killam-rock-museum-sunshine-coast/'))
video_blobs = [b for b in blobs_list if b.name.endswith('.mp4')]

# Build video URL map
video_urls = {}
for vb in video_blobs:
    fname = vb.name.split('/')[-1]  # video_1.mp4
    num = fname.replace('video_', '').replace('.mp4', '')
    target_name = f"the_kara_killam_rock_museum_sunshine_coast_t{num}"
    # Get the download URL with token
    vb.reload()
    token = vb.metadata.get('firebaseStorageDownloadTokens', '') if vb.metadata else ''
    if token:
        url = f"https://firebasestorage.googleapis.com/v0/b/x-web-ar-platform.firebasestorage.app/o/{vb.name.replace('/', '%2F')}?alt=media&token={token}"
    else:
        # Generate a new token
        import uuid
        token = str(uuid.uuid4())
        vb.metadata = {'firebaseStorageDownloadTokens': token}
        vb.patch()
        url = f"https://firebasestorage.googleapis.com/v0/b/x-web-ar-platform.firebasestorage.app/o/{vb.name.replace('/', '%2F')}?alt=media&token={token}"
    video_urls[target_name] = url
    print(f"  {target_name} -> video URL ready")

print(f"\nAll {len(video_urls)} video URLs resolved")

# Build the corrected HTML
name = "The Kara Killam Rock Museum (Sunshine Coast)"
targets_count = len(all_target_data)

# Build video assets HTML
video_assets_html = ''
for td in all_target_data:
    tname = td['name']
    vurl = video_urls.get(tname, '')
    video_assets_html += f'<video id="media-{tname}" src="{vurl}" preload="auto" loop="true" crossorigin="anonymous" playsinline webkit-playsinline muted></video>'

# Build target entities HTML
target_entities_html = ''
for td in all_target_data:
    tname = td['name']
    target_entities_html += f'<xrextras-named-image-target name="{tname}"><a-entity xrextras-play-video="video:#media-{tname}; thumb:#media-{tname}; canstop:true" geometry="primitive:plane; width:1; height:0.5625;" position="0 0 0" material="shader:flat;"></a-entity></xrextras-named-image-target>'

all_target_data_json = json.dumps(all_target_data)

# Build the full HTML
html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>{name} — X-WEB AR</title>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/aframe@1.5.0/dist/aframe-master.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js" async crossorigin="anonymous" data-preload-chunks="slam"></script>
  <script src="https://cdn.jsdelivr.net/npm/@8thwall/xrextras@1/dist/xrextras.js" crossorigin="anonymous"></script>
  <style>
    :root {{ --gold:#C9A84C; --black:#000; --white:#F5F5F5; --muted:rgba(245,245,245,0.5); }}
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    html, body {{ width:100%; height:100%; overflow:hidden; background:var(--black); color:var(--white); font-family:'Inter',sans-serif; }}
    .screen {{ position:fixed; inset:0; display:none; flex-direction:column; align-items:center; justify-content:center; }}
    .screen.active {{ display:flex; }}
    .launch-content {{ text-align:center; padding:0 24px; }}
    .launch-content h1 {{ font-family:'Oswald',sans-serif; font-size:clamp(28px,7vw,42px); }}
    .launch-content .instructions {{ font-size:14px; color:var(--muted); line-height:1.6; max-width:280px; margin:24px auto; }}
    .divider {{ width:64px; height:1px; background:rgba(201,168,76,0.4); margin:24px auto; }}
    .xweb-btn {{ padding:14px 36px; border:1px solid var(--gold); color:var(--gold); font-family:'Oswald',sans-serif; font-size:14px; letter-spacing:0.15em; text-transform:uppercase; background:transparent; cursor:pointer; }}
    .xweb-btn:hover {{ background:var(--gold); color:var(--black); }}
    #camera-screen {{ background:var(--black); }}
    #ar-container {{ position:absolute; inset:0; }}
    #ar-container a-scene {{ position:absolute; inset:0; }}
    .ar-header {{ position:fixed; top:0; left:0; right:0; z-index:100; display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:linear-gradient(to bottom,rgba(0,0,0,0.8),transparent); }}
    .back-btn {{ background:none; border:none; color:var(--gold); font-family:'Oswald',sans-serif; font-size:10px; letter-spacing:0.2em; cursor:pointer; }}
    .ar-footer {{ position:fixed; bottom:0; left:0; right:0; z-index:100; padding:16px; background:linear-gradient(to top,rgba(0,0,0,0.8),transparent); text-align:center; }}
    .ar-footer p {{ font-size:11px; color:var(--muted); }}
    .target-counter {{ position:fixed; top:50px; right:16px; z-index:100; font-family:'Oswald',sans-serif; font-size:11px; color:var(--gold); letter-spacing:0.1em; background:rgba(0,0,0,0.6); padding:6px 12px; border-radius:4px; }}
    .powered-by {{ position:absolute; bottom:8px; left:0; right:0; text-align:center; font-family:'Oswald',sans-serif; font-size:9px; color:rgba(245,245,245,0.2); letter-spacing:0.15em; }}
    [class*="powered-by-8thwall"], [class*="poweredby"], .xr8-powered-by {{ display:none !important; }}
    img[src*="8thwall"], img[src*="8th-wall"] {{ display:none !important; }}
  </style>
</head>
<body>
  <div id="launch-screen" class="screen active">
    <div class="launch-content">
      <p style="font-family:'Oswald',sans-serif; font-size:12px; color:var(--gold); letter-spacing:0.2em; margin-bottom:16px;">X-WEB</p>
      <div class="divider"></div>
      <h1>{name}</h1>
      <p style="font-family:'Oswald',sans-serif; font-size:12px; color:var(--muted); letter-spacing:0.1em; margin-top:8px;">{targets_count} TARGETS</p>
      <div class="divider"></div>
      <p class="instructions">Point your camera at any target image to play its video. This experience contains {targets_count} scannable targets.</p>
      <button class="xweb-btn" onclick="launchCamera()">OPEN CAMERA</button>
    </div>
    <div class="powered-by">POWERED BY X-WEB AR</div>
  </div>
  <div id="camera-screen" class="screen">
    <div id="ar-container">
      <a-scene xrextras-gesture-detector xrextras-loading xrextras-runtime-error renderer="colorManagement:true" xrweb="disableWorldTracking:true" embedded>
        <a-assets>{video_assets_html}</a-assets>
        <a-camera position="0 4 10" raycaster="objects:.cantap" cursor="fuse:false; rayOrigin:mouse;"></a-camera>
        <a-light type="directional" intensity="0.5" position="1 1 1"></a-light>
        <a-light type="ambient" intensity="1"></a-light>
        {target_entities_html}
      </a-scene>
    </div>
    <header class="ar-header">
      <button class="back-btn" onclick="exitCamera()">&#8592; EXIT</button>
      <span style="font-family:'Oswald',sans-serif; font-size:10px; color:var(--gold); letter-spacing:0.2em;">X-WEB</span>
    </header>
    <div class="target-counter">{targets_count} TARGETS</div>
    <div class="ar-footer"><p id="scan-hint">Point camera at any target image</p></div>
  </div>
  <script>
    var ALL_TARGET_DATA = {all_target_data_json};
    function launchCamera() {{
      document.getElementById("launch-screen").classList.remove("active");
      document.getElementById("camera-screen").classList.add("active");
      initAR();
    }}
    function exitCamera() {{
      document.getElementById("camera-screen").classList.remove("active");
      document.getElementById("launch-screen").classList.add("active");
    }}
    async function initAR() {{
      try {{
        await waitForXR8();
        XR8.XrController.configure({{ imageTargetData: ALL_TARGET_DATA }});
        setupListeners();
      }} catch(err) {{
        document.getElementById("scan-hint").textContent = "Error: " + err.message;
      }}
    }}
    function waitForXR8() {{
      return new Promise(function(resolve, reject) {{
        if (window.XR8) return resolve();
        window.addEventListener("xrloaded", function() {{ resolve(); }}, {{ once: true }});
        setTimeout(function() {{ reject(new Error("X-WEB AR engine failed to load")); }}, 15000);
      }});
    }}
    function setupListeners() {{
      document.querySelectorAll("xrextras-named-image-target").forEach(function(targetEl) {{
        var tName = targetEl.getAttribute("name");
        targetEl.addEventListener("xrimagefound", function() {{
          document.getElementById("scan-hint").textContent = "Target found \\u2014 tap video to play";
          var vid = document.getElementById("media-" + tName);
          if (vid) {{ vid.addEventListener("play", function() {{ vid.muted = false; }}, {{ once: true }}); }}
        }});
        targetEl.addEventListener("xrimagelost", function() {{
          document.getElementById("scan-hint").textContent = "Point camera at any target image";
        }});
      }});
      var observer = new MutationObserver(function() {{
        document.querySelectorAll("*").forEach(function(el) {{
          if(el.children.length === 0 && el.textContent && el.textContent.indexOf("8th Wall") !== -1) {{
            el.textContent = el.textContent.replace(/8th Wall/gi, "X-WEB");
          }}
        }});
      }});
      observer.observe(document.body, {{ childList:true, subtree:true }});
    }}
  </script>
</body>
</html>'''

# Upload the fixed HTML
print(f"\nGenerated HTML: {len(html)} chars")
print("Uploading to Firebase Storage...")

upload_blob = bucket.blob('experiences/the-kara-killam-rock-museum-sunshine-coast/index.html')
upload_blob.upload_from_string(html, content_type='text/html')

# Set the download token so the URL stays the same
upload_blob.reload()
if upload_blob.metadata and 'firebaseStorageDownloadTokens' in upload_blob.metadata:
    token = upload_blob.metadata['firebaseStorageDownloadTokens']
else:
    import uuid
    token = str(uuid.uuid4())
    upload_blob.metadata = {'firebaseStorageDownloadTokens': token}
    upload_blob.patch()

url = f"https://firebasestorage.googleapis.com/v0/b/x-web-ar-platform.firebasestorage.app/o/experiences%2Fthe-kara-killam-rock-museum-sunshine-coast%2Findex.html?alt=media&token={token}"
print(f"\nDone! Experience URL:\n{url}")
