import { fromFigmaNode } from "./src/alt_nodes/builder.js";

// Configuration for localhost development
const LOCAL_UI_URL = "https://local.adobe.com/plugin/ui.html"; // Ensure this points to your HTML file

console.log(`🚀 Loading UI from localhost: ${LOCAL_UI_URL}`);

// Show UI from local server
figma.showUI(`<script>window.location.href = "${LOCAL_UI_URL}"</script>`, {
  width: 450,
  height: 650,
  title: "Figma to Odin Plugin",
});

// Handle messages from the external UI
figma.ui.onmessage = (message) => {
  console.log("📨 Message received from localhost UI:", message);

  switch (message.type) {
    case "ui-ready":
      console.log("✅ UI is ready and connected!");
      figma.ui.postMessage({
        type: "plugin-ready",
        data: {
          selection: figma.currentPage.selection.length,
          pageName: figma.currentPage.name,
          message: "Connected to localhost! 🎉",
        },
      });
      // Also send initial layer data or status on UI ready
      sendCurrentSelectionData(); 
      break;

    case "describeSelectedLayer": // This case might become less used if selectionchange handles it
      console.log("Request to describe layer received (manual trigger).");
      sendCurrentSelectionData();
      break;

    case "close":
      console.log("👋 Closing plugin...");
      figma.closePlugin();
      break;

    default:
      console.log("❓ Unknown message type:", message.type);
  }
};

// Listen for selection changes in Figma
figma.on("selectionchange", () => {
  console.log("🎨 Figma selection changed.");
  sendCurrentSelectionData();
});

async function sendCurrentSelectionData() {
  const selection = figma.currentPage.selection;
  if (selection.length === 1) {
    console.log("Single layer selected, generating description.");
    const altNode = await fromFigmaNode(selection[0]);
    console.log("Alt node:", altNode.toJson());
    figma.ui.postMessage({
      type: "layerData",
      payload: altNode.toJson(),
    });
  } else if (selection.length === 0) {
    console.log("No layer selected.");
    figma.ui.postMessage({
      type: "layerData",
      payload: undefined,
    });
  } else {
    console.log("Multiple layers selected.");
    figma.ui.postMessage({
      type: "layerData",
      payload: undefined,
    });
  }
}

console.log(
  "🔧 Plugin started - make sure your localhost server is running on port 3000!"
);
