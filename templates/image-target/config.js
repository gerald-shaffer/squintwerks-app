/**
 * X-WEB Image Target — App Configuration
 * ========================================
 * THIS IS THE ONLY FILE YOU NEED TO EDIT PER CLIENT.
 *
 * Instructions:
 * 1. Set appName and channelName for branding
 * 2. Generate image target data using the CLI:
 *    npx @8thwall/image-target-cli@latest generate <image-file>
 *    OR use the custom script: node scripts/generate-target.mjs <image-file> <output-dir>
 * 3. Paste the generated JSON into the targets array below
 * 4. Set the videoUrl or audioUrl for each target
 * 5. Deploy: npx firebase deploy --only hosting:SITE_NAME --project x-web-ar-platform
 */

const XWEB_CONFIG = {
  // ─── BRANDING ─────────────────────────────────────────────
  appName: "DEMO CAM",                    // Displayed on launch screen
  channelName: "X-WEB Demo Channel",      // Displayed in footer/header
  poweredBy: "Shaffer Media Group",       // Bottom-right attribution

  // ─── TARGETS ──────────────────────────────────────────────
  // Each target needs:
  //   name: string (must match the name in targetData)
  //   label: string (human-readable, shown in UI)
  //   targetData: object (the JSON output from image-target-cli)
  //   contentType: "video" | "audio"
  //   contentUrl: string (URL to video/audio file — use Firebase Storage)
  //   thumbUrl: string (optional — luminance image URL for visual reference)
  //
  targets: [
    // ─── EXAMPLE TARGET (replace with real data) ────────────
    // {
    //   name: "target-1",
    //   label: "Target #1",
    //   targetData: { /* paste generated JSON here */ },
    //   contentType: "video",
    //   contentUrl: "https://firebasestorage.googleapis.com/v0/b/x-web-ar-platform.firebasestorage.app/o/xweb-assets%2Fdemo%2Fvideo.mp4?alt=media",
    //   thumbUrl: "https://firebasestorage.googleapis.com/v0/b/x-web-ar-platform.firebasestorage.app/o/xweb-assets%2Fdemo%2Fthumbnail.png?alt=media"
    // }
  ],

  // ─── OPTIONS ──────────────────────────────────────────────
  options: {
    disableWorldTracking: true,   // true for image-only (saves battery)
    videoLoop: true,              // loop video playback
    videoMuted: false,            // start with audio on (after tap)
    showViewfinder: true,         // show corner brackets while scanning
  }
};
