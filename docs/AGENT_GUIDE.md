# X-WEB AR Platform — Agent Guide

This document is written for future Manus AI agents tasked with creating new X-WEB AR experiences for clients. It outlines the platform architecture, the template system, and the exact steps required to deploy a new client app.

## Platform Architecture

The X-WEB AR platform is hosted entirely on Firebase, utilizing Firebase Hosting for serving the web apps and Firebase Storage for hosting assets (videos, audio, 3D models). The platform is designed to be **multi-tenant but isolated** — each client receives their own dedicated Firebase Hosting site within the single `x-web-ar-platform` Firebase project.

This architecture provides several key benefits:
- **Isolation:** One client's code cannot affect another's.
- **White-labeling:** Each site can have its own custom domain (e.g., `ar.sunshinecoastgolf.com`).
- **Simplicity:** Agents only need to copy a template, edit a single configuration file, and deploy.

The core AR engine is powered by the open-source 8th Wall binary (`xr.js`), which runs entirely client-side in the browser. No backend server is required.

## Available Templates

The platform provides three distinct AR experience templates, located in `/home/ubuntu/x-web-ar-platform/templates/`:

### 1. Image Target AR (`image-target`)
**Use case:** A user scans a physical image (e.g., a wine label, a museum placard, an airline safety card), and a video or audio docent (Janet) plays, anchored to the image.
**Key features:** Supports multiple targets per app, video overlay, audio-only mode with visual indicator, tap-to-play functionality.

### 2. World Target AR (`world-target`)
**Use case:** A user arrives at a specific GPS location (e.g., a historical site, a golf tee box), and a 3D model appears in their camera view.
**Key features:** GPS distance calculation, approaching state UI, Three.js renderer with lighting and shadows, GLTF model loading.

### 3. Comms AR (`comms-ar`)
**Use case:** A user scans a physical image, which triggers a direct VoIP call to a designated person or service (e.g., a concierge, a curator).
**Key features:** Password-protected access (prototype), Twilio Client integration, custom call UI.

## How to Create a New Client App

When tasked with creating a new X-WEB experience for a client, follow these exact steps:

### Step 1: Create the Firebase Hosting Site
First, create a new hosting site for the client within the Firebase project. The site name must be unique across all of Firebase.

```bash
cd /home/ubuntu/x-web-ar-platform
export GOOGLE_APPLICATION_CREDENTIALS="/home/ubuntu/x-web-ar-platform/service-account.json"
npx firebase hosting:sites:create <client-site-name> --project x-web-ar-platform
```

### Step 2: Update `firebase.json`
Add the new site to the `firebase.json` configuration file. Copy the configuration block from the appropriate template and update the `site` and `public` fields.

```json
{
  "site": "<client-site-name>",
  "public": "clients/<client-site-name>/dist",
  "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
  "rewrites": [ { "source": "**", "destination": "/index.html" } ],
  "headers": [ /* copy headers from template */ ]
}
```

### Step 3: Copy the Template
Create a new directory for the client and copy the contents of the desired template into it.

```bash
mkdir -p /home/ubuntu/x-web-ar-platform/clients/<client-site-name>
cp -r /home/ubuntu/x-web-ar-platform/templates/<template-name>/* /home/ubuntu/x-web-ar-platform/clients/<client-site-name>/
```

### Step 4: Configure the App
Open the `config.js` file in the client's directory. **This is the only file you need to edit.**

- Update the `appName` and `channelName` for the client's branding.
- For **Image Targets**: Generate the target data using the 8th Wall CLI (`npx @8thwall/image-target-cli@latest generate <image-file>`) and paste the resulting JSON into the `targets` array. Set the `contentUrl` to the Firebase Storage URL of the video/audio asset.
- For **World Targets**: Set the `gps.latitude`, `gps.longitude`, and `gps.radius`. Set the `model.url` to the Firebase Storage URL of the `.glb` file.

### Step 5: Build and Deploy
Copy the shared design system CSS and build the `dist` directory, then deploy to Firebase.

```bash
cd /home/ubuntu/x-web-ar-platform/clients/<client-site-name>
mkdir -p dist/styles
cp index.html dist/
cp config.js dist/
cp app.js dist/
cp /home/ubuntu/x-web-ar-platform/shared/styles/xweb-theme.css dist/styles/
cp styles/app.css dist/styles/

cd /home/ubuntu/x-web-ar-platform
export GOOGLE_APPLICATION_CREDENTIALS="/home/ubuntu/x-web-ar-platform/service-account.json"
npx firebase deploy --only hosting:<client-site-name> --project x-web-ar-platform
```

## Design System

All X-WEB apps share a common design system located at `shared/styles/xweb-theme.css`. This system enforces the "Broadcast Terminal" aesthetic:
- **Colors:** True black background, X-WEB gold accents (`#C9A84C`), white text.
- **Typography:** Oswald for display headings, Inter for body text.
- **Components:** Standardized buttons, status indicators (online/scanning/live), and viewfinder corners.

Do not modify the shared theme file unless instructed to update the global X-WEB brand.

## Asset Management

All media assets (videos, audio, 3D models, target images) should be uploaded to the Firebase Storage bucket: `x-web-ar-platform.firebasestorage.app`.

Organize assets by client within the `xweb-assets/` directory (e.g., `xweb-assets/sunshine-coast-golf/hole1.mp4`). Ensure that the Firebase Storage rules allow public read access to these assets.
