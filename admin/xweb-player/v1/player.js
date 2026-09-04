(() => {
  const root = document.getElementById("ar-root");
  const MANIFEST_ORIGIN = "https://x-web.io";
  const MAX_ACTIVE_EXPERIENCES = 12;
  let activeTargets = [];
  let activeTarget = null;
  let currentScene = null;
  let engineReady = false;
  let requestVersion = 0;

  function notify(type, details = {}) {
    const payload = JSON.stringify({ type, ...details });
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(payload);
    }
  }

  function cleanExperienceIds(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value)]
      .filter((id) => typeof id === "string" && /^[a-z0-9-]{3,96}$/.test(id))
      .slice(0, MAX_ACTIVE_EXPERIENCES);
  }

  function cleanManifest(raw, expectedId) {
    if (!raw || raw.schemaVersion !== 1 || raw.id !== expectedId) return null;
    if (typeof raw.targetName !== "string" || !/^[a-z0-9-]{1,96}$/.test(raw.targetName)) return null;
    if (!raw.targetData || typeof raw.targetData !== "object") return null;
    if (typeof raw.contentUrl !== "string" || !raw.contentUrl.startsWith("https://")) return null;
    if (raw.contentType !== "video" && raw.contentType !== "audio") return null;
    return raw;
  }

  async function fetchManifest(experienceId) {
    const response = await fetch(`${MANIFEST_ORIGIN}/x/${experienceId}/manifest.json`, {
      headers: { Accept: "application/json" },
      mode: "cors",
    });
    if (!response.ok) throw new Error("Published experience unavailable");
    const manifest = cleanManifest(await response.json(), experienceId);
    if (!manifest) throw new Error("Published experience is not valid");
    return manifest;
  }

  function cleanupScene() {
    if (currentScene) currentScene.remove();
    currentScene = null;
    activeTarget = null;
    root.replaceChildren();
  }

  function makeMedia(target) {
    const media = document.createElement(target.contentType === "audio" ? "audio" : "video");
    media.id = `xweb-media-${target.id}`;
    media.src = target.contentUrl;
    media.preload = "auto";
    media.crossOrigin = "anonymous";
    media.playsInline = true;
    media.setAttribute("webkit-playsinline", "true");
    return media;
  }

  function makeTargetEntity(target) {
    const namedTarget = document.createElement("xrextras-named-image-target");
    namedTarget.setAttribute("name", target.targetName);
    const plane = document.createElement("a-entity");
    plane.setAttribute("geometry", "primitive: plane; height: 1; width: 0.75");
    plane.setAttribute("class", "cantap");
    namedTarget.appendChild(plane);

    namedTarget.addEventListener("xrimagefound", () => {
      activeTarget = target;
      notify("target-found", { experienceId: target.id });
    });
    namedTarget.addEventListener("xrimagelost", () => {
      if (activeTarget?.id === target.id) {
        activeTarget = null;
        notify("target-lost", { experienceId: target.id });
      }
    });
    return namedTarget;
  }

  function buildScene() {
    cleanupScene();
    if (!activeTargets.length) {
      notify("player-ready");
      return;
    }
    const scene = document.createElement("a-scene");
    const assets = document.createElement("a-assets");
    scene.setAttribute("embedded", "");
    scene.setAttribute("renderer", "colorManagement:true");
    scene.setAttribute("xrweb", "disableWorldTracking: true");
    scene.setAttribute("xrextras-gesture-detector", "");
    scene.setAttribute("xrextras-loading", "");
    scene.setAttribute("xrextras-runtime-error", "");

    activeTargets.forEach((target) => {
      assets.appendChild(makeMedia(target));
      scene.appendChild(makeTargetEntity(target));
    });
    scene.appendChild(assets);
    const camera = document.createElement("a-camera");
    camera.setAttribute("position", "0 4 10");
    camera.setAttribute("raycaster", "objects: .cantap");
    camera.setAttribute("cursor", "fuse: false; rayOrigin: mouse");
    scene.appendChild(camera);
    root.appendChild(scene);
    currentScene = scene;
    notify("player-ready");
  }

  async function configureActiveSet(experienceIds) {
    const thisRequest = ++requestVersion;
    const ids = cleanExperienceIds(experienceIds);
    cleanupScene();
    if (!ids.length) {
      activeTargets = [];
      notify("player-ready");
      return;
    }
    try {
      const manifests = await Promise.all(ids.map(fetchManifest));
      if (thisRequest !== requestVersion) return;
      activeTargets = manifests;
      await waitForEngine();
      if (thisRequest !== requestVersion) return;
      window.XR8.XrController.configure({ imageTargetData: activeTargets.map((target) => target.targetData) });
      buildScene();
    } catch (error) {
      if (thisRequest === requestVersion) {
        notify("error", { message: "One or more selected X-WEB experiences are unavailable." });
      }
    }
  }

  function waitForEngine() {
    if (engineReady && window.XR8) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("XWEBAR engine unavailable")), 15000);
      window.addEventListener("xrloaded", () => {
        engineReady = true;
        window.clearTimeout(timer);
        resolve();
      }, { once: true });
    });
  }

  function playActiveTarget() {
    if (!activeTarget) return;
    const media = document.getElementById(`xweb-media-${activeTarget.id}`);
    if (!media) return;
    media.play()
      .then(() => notify("playing", { experienceId: activeTarget.id }))
      .catch(() => notify("error", { message: "This experience could not play on this device." }));
  }

  function receive(event) {
    try {
      const command = JSON.parse(event.data || event);
      if (command.type === "set-active-experience-ids") configureActiveSet(command.experienceIds);
      if (command.type === "play-active-target") playActiveTarget();
    } catch {
      notify("error", { message: "The X-WEB app sent an unreadable player command." });
    }
  }

  window.addEventListener("message", receive);
  document.addEventListener("message", receive);
  notify("player-ready");
})();
