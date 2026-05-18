/**
 * X-WEB Comms AR — App Configuration
 * ====================================
 * PASSWORD PROTECTED PROTOTYPE
 *
 * THIS IS THE ONLY FILE YOU NEED TO EDIT PER CLIENT.
 *
 * Instructions:
 * 1. Set the access password
 * 2. Configure the image target (same process as image-target template)
 * 3. Set the Twilio token endpoint (a Firebase Cloud Function or external API)
 * 4. Set the destination number or SIP address
 * 5. Deploy: npx firebase deploy --only hosting:SITE_NAME --project x-web-ar-platform
 *
 * TWILIO SETUP:
 * You need a Twilio account with:
 * - A TwiML App configured for client-to-PSTN calls
 * - A server endpoint that returns a Twilio Client capability token
 * - The endpoint should accept POST and return JSON: { "token": "..." }
 */

const XWEB_CONFIG = {
  // ─── ACCESS ───────────────────────────────────────────────
  password: "gerald",                     // Access password for this prototype

  // ─── BRANDING ─────────────────────────────────────────────
  appName: "COMMS",
  channelName: "Direct Line",
  poweredBy: "Shaffer Media Group",

  // ─── IMAGE TARGET ─────────────────────────────────────────
  target: {
    name: "comms-trigger",
    label: "Direct Line",
    targetData: { /* paste generated image target JSON here */ },
  },

  // ─── TWILIO VOIP ──────────────────────────────────────────
  twilio: {
    // Server endpoint that returns a Twilio Client capability token
    // This should be a Firebase Cloud Function or external API
    tokenEndpoint: "https://YOUR_CLOUD_FUNCTION_URL/getToken",

    // The phone number or SIP address to call when triggered
    // Format: "+1XXXXXXXXXX" for PSTN, "sip:user@domain" for SIP
    destination: "+1234567890",

    // Caller ID (must be a verified Twilio number)
    callerId: "+1234567890",

    // Call label shown in UI
    callLabel: "CONNECTING TO CONCIERGE",
  },

  // ─── OPTIONS ──────────────────────────────────────────────
  options: {
    disableWorldTracking: true,
    autoCall: false,                      // true = call immediately on target detect
                                          // false = show "tap to call" button
  }
};
