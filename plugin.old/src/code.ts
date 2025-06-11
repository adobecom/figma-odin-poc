// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

import { AltBaseNode, CFField } from "./alt_nodes/base_node.js";
import { fromFigmaNode } from "./alt_nodes/builder.js";

const cfmModels: Record<string, { fields: any[] }> = {};
const cFragments: Record<string, { fields: any[], title: string, model: { id: string } }> = {};

type PluginMessage =
  | { type: "show-json" }
  | { type: "show-node" }
  | { type: "upload-image" }
  | { type: "initialModelsLoaded"; models: any[] }
  | { type: "fragmentCreated"; fragment: any; modelId: string }
  | { type: "fragmentModified"; fragment: any }
  | { type: "fragmentDeleted"; fragmentId: string }
  | { type: "modelCreated"; model: any };

// function to async process a node
async function processNode(node: BaseNode): Promise<AltBaseNode> {
  const altNode = await fromFigmaNode(node);
  return altNode;
}

function matchingModel(altNode: AltBaseNode): string {
  const fields: CFField[] = altNode.getFieldsSorted();

  for (const modelId in cfmModels) {
    const modelFields = cfmModels[modelId].fields;
    if (fields.length !== modelFields.length) {
      continue;
    }

    let match = true;
    for (let i = 0; i < fields.length; i++) {
      if (fields[i].type !== modelFields[i].type) {
        match = false;
        break;
      }
    }

    if (match) {
      return modelId;
    }
  }

  return "";
}

figma.on("selectionchange", async () => {
  const selectedNode = figma.currentPage.selection[0];
  if (selectedNode) {
    const fragmentId = selectedNode.getPluginData("fragmentId") || null;
    const altNode = await processNode(selectedNode);
    const modelId = matchingModel(altNode);

    if (fragmentId && !(fragmentId in cFragments)) {
      // Fragment doesn't exist anymore, clear the plugin data
      selectedNode.setPluginData("fragmentId", "");
      selectedNode.setPluginData("modelId", "");

      figma.ui.postMessage({
        type: "nodeSelected",
        modelId: modelId,
        fragmentId: null,
        fragmentName: null,
        altNode: altNode.toJson(),
      });
      console.log(
        `ModelId: ${modelId}, FragmentId: ${fragmentId}, FragmentName: null`
      );
    } else if (fragmentId) {
      const fragmentName = cFragments[fragmentId].title;
      const existingModelId = cFragments[fragmentId].model.id;

      figma.ui.postMessage({
        type: "nodeSelected",
        modelId: existingModelId,
        fragmentId: fragmentId,
        fragmentName: fragmentName,
        altNode: altNode.toJson(),
      });
      console.log(
        `ModelId: ${existingModelId}, FragmentId: ${fragmentId}, FragmentName: ${fragmentName}`
      );
    } else {
      figma.ui.postMessage({
        type: "nodeSelected",
        modelId: modelId,
        fragmentId: null,
        fragmentName: null,
        altNode: altNode.toJson(),
      });
      console.log(`ModelId: ${modelId}, FragmentId: null, FragmentName: null`);
    }
  } else {
    // No node selected
    figma.ui.postMessage({
      type: "nodeSelected",
      modelId: "",
      fragmentId: null,
      fragmentName: null,
      altNode: null,
    });
  }
});

figma.ui.onmessage = (msg: PluginMessage) => {
  console.log("Received message: ", msg);
  
  if (msg.type === "initialModelsLoaded") {
    // Populate cfmModels from UI
    for (const model of msg.models) {
      cfmModels[model.id] = model;
    }
    console.log("Models loaded from UI:", Object.keys(cfmModels).length);
  } else if (msg.type === "modelCreated") {
    const model = msg.model;
    cfmModels[model.id] = model;
    const node = figma.currentPage.selection[0];
    if (node) {
      node.setPluginData("modelId", model.id);
    }
    console.log("Model created and stored:", model.id);
  } else if (msg.type === "fragmentCreated") {
    const fragment = msg.fragment;
    cFragments[fragment.id] = fragment;
    const node = figma.currentPage.selection[0];
    if (node) {
      node.setPluginData("modelId", msg.modelId);
      node.setPluginData("fragmentId", fragment.id);
    }
    console.log("Fragment created and stored:", fragment.id);
  } else if (msg.type === "fragmentModified") {
    const fragment = msg.fragment;
    cFragments[fragment.id] = fragment;
    console.log("Fragment modified and stored:", fragment.id);
  } else if (msg.type === "fragmentDeleted") {
    delete cFragments[msg.fragmentId];
    const node = figma.currentPage.selection[0];
    if (node) {
      node.setPluginData("fragmentId", "");
      node.setPluginData("modelId", "");
    }
    console.log("Fragment deleted:", msg.fragmentId);
  } else if (msg.type === "show-json") {
    const node = figma.currentPage.selection[0];
    if (node) {
      processNode(node)
        .then((altNode) => {
          console.log("AltNode: ", JSON.stringify(altNode.toJson(), null, 2));
        })
        .catch((error) => {
          console.error("Failed to show JSON: ", error.message);
        });
    }
  } else if (msg.type === "show-node") {
    const node = figma.currentPage.selection[0];
    if (node) {
      console.log("Selected node: ", node);
    }
  } else if (msg.type === "upload-image") {
    const node = figma.currentPage.selection[0];
    if (node) {
      // Image upload functionality would go here
      figma.ui.postMessage({
        type: "success",
        message: "Image upload not implemented yet",
      });
    }
  }
};

const LOCAL_UI_URL = "https://local.adobe.com/plugin.old/ui.html"; // Ensure this points to your HTML file

console.log(`🚀 Loading UI from localhost: ${LOCAL_UI_URL}`);

// Show UI from local server
figma.showUI(`<script>window.location.href = "${LOCAL_UI_URL}"</script>`, {
  width: 450,
  height: 650,
  title: "Figma to Odin Plugin",
});


export { cFragments, cfmModels }; 