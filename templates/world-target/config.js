/**
 * X-WEB World Target — App Configuration
 * ========================================
 * THIS IS THE ONLY FILE YOU NEED TO EDIT PER CLIENT.
 *
 * Instructions:
 * 1. Set appName and channelName for branding
 * 2. Set the GPS coordinates (lat/lng) for the experience location
 * 3. Set the trigger radius in meters
 * 4. Set the 3D model URL (.glb file hosted on Firebase Storage)
 * 5. Adjust model scale and rotation as needed
 * 6. Deploy: npx firebase deploy --only hosting:SITE_NAME --project x-web-ar-platform
 */

const XWEB_CONFIG = {
  // ─── BRANDING ─────────────────────────────────────────────
  appName: "LANDYVILLE",                  // Displayed on launch screen
  channelName: "World Collection",        // Displayed in footer/header
  poweredBy: "Shaffer Media Group",       // Bottom-right attribution

  // ─── EXPERIENCE ───────────────────────────────────────────
  experience: {
    title: "Land Rover Series IIA",       // Shown in camera view title bar
    location: "Rovers North, Westford VT", // Shown below title
    description: "A classic 1967 Series IIA stationed at the legendary Rovers North workshop.",
  },

  // ─── GPS TARGET ───────────────────────────────────────────
  gps: {
    latitude: 44.58716,                   // Target latitude (decimal degrees)
    longitude: -73.01465,                 // Target longitude (decimal degrees)
    radius: 100,                          // Trigger radius in meters
                                          // 30 = tight (production)
                                          // 100 = casual testing
                                          // 999999 = bypass GPS (remote testing)
  },

  // ─── 3D MODEL ─────────────────────────────────────────────
  model: {
    url: "",                              // .glb file URL (Firebase Storage)
                                          // Example: "https://firebasestorage.googleapis.com/v0/b/x-web-ar-platform.firebasestorage.app/o/xweb-assets%2Fmodels%2Flandrover.glb?alt=media"
    scale: 3,                             // Display scale (1=tiny, 3=car-sized, 10=large)
    rotationY: 0,                         // Y-axis rotation in degrees
  },

  // ─── RENDERER OPTIONS ─────────────────────────────────────
  renderer: {
    showGround: true,                     // Dark reflective ground plane
    showGrid: true,                       // Grid overlay on ground
    showFog: true,                        // Atmospheric fog
    cameraHeight: 1.8,                    // Camera Y position (eye level)
    cameraDistance: 7,                    // Camera Z distance from model
    backgroundColor: 0x000000,            // Scene background color
  }
};
