(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/alt_nodes/base_node.ts
  var AltBaseNode = class {
    constructor() {
      __publicField(this, "type", "div" /* Div */);
      __publicField(this, "figmaId");
      __publicField(this, "cfId");
      __publicField(this, "cfModelId");
      __publicField(this, "name");
      __publicField(this, "css");
      __publicField(this, "children");
      __publicField(this, "top_left_corner");
      this.figmaId = "";
      this.name = "";
      this.css = {};
      this.children = [];
      this.top_left_corner = { x: 0, y: 0 };
      this.cfId = null;
      this.cfModelId = null;
    }
    setFragment(id) {
      this.cfId = id;
    }
    setFragmentModel(id) {
      this.cfModelId = id;
    }
    async fromFigmaNode(node) {
      this.figmaId = node.id;
      this.name = node.name.replaceAll(" ", "-").toLowerCase();
      this.css = await node.getCSSAsync();
      this.top_left_corner = {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y
      };
      if (node.children) {
        this.children = [];
        for (const child of node.children) {
          const altNode = await fromFigmaNode(child);
          this.children.push(altNode);
        }
      }
    }
    toCSS(parentClassName = "", isHead = false) {
      let css = "";
      const className = isHead ? `.${this.name}` : `${parentClassName} > .${this.name}`;
      if (this.css) {
        css += `${parentClassName} {
`;
        for (const key in this.css) {
          css += `    ${key}: ${this.css[key]};
`;
        }
        css += "}\n\n";
      }
      if (this.children) {
        for (const child of this.children) {
          css += child.toCSS(`${className}`);
        }
      }
      return css;
    }
    toJson() {
      return {
        type: this.type,
        name: this.name,
        css: this.css,
        children: this.children.map((child) => child.toJson())
      };
    }
    toField() {
      return null;
    }
    getFields(list, isRoot = false) {
      const field = this.toField();
      if (field) {
        list.push(field);
      }
      for (const child of this.children) {
        child.getFields(list, false);
      }
    }
    getFieldsSorted() {
      const fields = [];
      this.getFields(fields, true);
      fields.sort((a, b) => {
        if (a.top_left_corner.y < b.top_left_corner.y) {
          return -1;
        }
        if (a.top_left_corner.y > b.top_left_corner.y) {
          return 1;
        }
        if (a.top_left_corner.x < b.top_left_corner.x) {
          return -1;
        }
        if (a.top_left_corner.x > b.top_left_corner.x) {
          return 1;
        }
        return 0;
      });
      return fields;
    }
    toContentFragmentModel() {
      const fields = this.getFieldsSorted();
      return {
        "name": this.name,
        "fields": fields.map((field) => {
          return {
            "name": field.name,
            "label": field.label,
            "type": field.type,
            "required": field.required,
            "multiple": field.multiple
          };
        }),
        "configurationFolder": "/conf/sandbox/figmapoc",
        "description": `${this.name} model generated from Figma`,
        "locked": "false",
        "status": "enabled"
      };
    }
  };

  // src/alt_nodes/asset_node.ts
  var AltAssetNode = class extends AltBaseNode {
    constructor() {
      super();
      __publicField(this, "src");
      this.src = "";
    }
    async fromFigmaNode(node) {
      await super.fromFigmaNode(node);
      this.src = "https://via.placeholder.com/150";
      return Promise.resolve();
    }
    toJson() {
      return {
        type: this.type,
        name: this.name,
        css: this.css,
        children: this.children.map((child) => child.toJson()),
        src: this.src
      };
    }
    toField() {
      return {
        top_left_corner: this.top_left_corner,
        name: this.name,
        label: this.name,
        type: "content-reference",
        required: false,
        multiple: false,
        value: this.src
      };
    }
  };

  // src/alt_nodes/fragment_node.ts
  var AltFragmentNode = class extends AltBaseNode {
    constructor() {
      super();
      __publicField(this, "path");
      __publicField(this, "modelId");
      this.path = "";
      this.modelId = "";
    }
    async fromFigmaNode(node) {
      await super.fromFigmaNode(node);
      const fragmentId = node.getPluginData("fragmentId");
      if (fragmentId && fragmentId in cFragments) {
        this.path = cFragments[fragmentId].path;
        this.modelId = cFragments[fragmentId].model.id;
      } else {
        this.path = "";
        this.modelId = "";
      }
    }
    toJson() {
      return {
        type: this.type,
        name: this.name,
        css: this.css,
        children: this.children.map((child) => child.toJson()),
        path: this.path
      };
    }
    toField() {
      return {
        top_left_corner: this.top_left_corner,
        name: this.name,
        label: this.name,
        type: "content-fragment",
        required: false,
        multiple: false,
        items: [this.modelId],
        value: this.path
      };
    }
    getFields(list, isRoot) {
      if (isRoot) {
        for (const child of this.children) {
          child.getFields(list, false);
        }
        return;
      }
      const field = this.toField();
      if (field) {
        list.push(field);
      }
    }
  };

  // src/alt_nodes/text_node.ts
  var AltTextNode = class extends AltBaseNode {
    constructor() {
      super();
      __publicField(this, "longTextSize", 100);
      __publicField(this, "text");
      this.text = "";
      this.type = "span" /* Span */;
    }
    async fromFigmaNode(node) {
      await super.fromFigmaNode(node);
      this.text = node.characters;
    }
    toJson() {
      return {
        type: this.type,
        name: this.name,
        css: this.css,
        children: this.children.map((child) => child.toJson()),
        text: this.text
      };
    }
    toField() {
      const textType = this.text.length > this.longTextSize ? "long-text" : "text";
      return {
        top_left_corner: this.top_left_corner,
        name: this.name,
        label: this.name,
        type: textType,
        required: false,
        multiple: false,
        value: this.text
      };
    }
  };

  // src/alt_nodes/builder.ts
  async function fromFigmaNode(node) {
    let altNode;
    if (node.getPluginData("fragmentId")) {
      altNode = new AltFragmentNode();
      console.log("FRAGMENT NODE");
    } else if (node.type === "TEXT") {
      altNode = new AltTextNode();
      console.log("TEXT NODE");
    } else if (node.type === "RECTANGLE" && node.fills.length > 0 && node.fills[0].type === "IMAGE") {
      altNode = new AltAssetNode();
      console.log("ASSET NODE");
    } else {
      altNode = new AltBaseNode();
      console.log("BASE NODE");
    }
    await altNode.fromFigmaNode(node);
    return altNode;
  }

  // src/code.ts
  var cfmModels = {};
  var cFragments = {};
  async function processNode(node) {
    const altNode = await fromFigmaNode(node);
    return altNode;
  }
  function matchingModel(altNode) {
    const fields = altNode.getFieldsSorted();
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
        selectedNode.setPluginData("fragmentId", "");
        selectedNode.setPluginData("modelId", "");
        figma.ui.postMessage({
          type: "nodeSelected",
          modelId,
          fragmentId: null,
          fragmentName: null,
          altNode: altNode.toJson()
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
          fragmentId,
          fragmentName,
          altNode: altNode.toJson()
        });
        console.log(
          `ModelId: ${existingModelId}, FragmentId: ${fragmentId}, FragmentName: ${fragmentName}`
        );
      } else {
        figma.ui.postMessage({
          type: "nodeSelected",
          modelId,
          fragmentId: null,
          fragmentName: null,
          altNode: altNode.toJson()
        });
        console.log(`ModelId: ${modelId}, FragmentId: null, FragmentName: null`);
      }
    } else {
      figma.ui.postMessage({
        type: "nodeSelected",
        modelId: "",
        fragmentId: null,
        fragmentName: null,
        altNode: null
      });
    }
  });
  figma.ui.onmessage = (msg) => {
    console.log("Received message: ", msg);
    if (msg.type === "initialModelsLoaded") {
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
        processNode(node).then((altNode) => {
          console.log("AltNode: ", JSON.stringify(altNode.toJson(), null, 2));
        }).catch((error) => {
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
        figma.ui.postMessage({
          type: "success",
          message: "Image upload not implemented yet"
        });
      }
    }
  };
  var LOCAL_UI_URL = "https://main--figma-odin-poc--adobecom.aem.live/plugin.old/ui.html";
  console.log(`\u{1F680} Loading UI from localhost: ${LOCAL_UI_URL}`);
  figma.showUI(`<script>window.location.href = "${LOCAL_UI_URL}"<\/script>`, {
    width: 450,
    height: 650,
    title: "Figma to Odin Plugin"
  });
})();
