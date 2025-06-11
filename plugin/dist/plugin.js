(() => {
  // src/alt_nodes/base_node.js
  var AltType = {
    Div: "div",
    Span: "span"
  };
  var AltBaseNode = class {
    constructor() {
      this.type = AltType.Div;
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
        name: this.name,
        fields: fields.map((field) => {
          return {
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            multiple: field.multiple
          };
        }),
        configurationFolder: "/conf/sandbox",
        description: `${this.name} model generated from Figma`,
        locked: "false",
        status: "enabled"
      };
    }
  };

  // src/alt_nodes/asset_node.js
  var AltAssetNode = class extends AltBaseNode {
    constructor() {
      super();
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

  // src/odin.js
  var cFragments = {};

  // src/alt_nodes/fragment_node.js
  var AltFragmentNode = class extends AltBaseNode {
    constructor() {
      super();
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

  // src/alt_nodes/text_node.js
  var AltTextNode = class extends AltBaseNode {
    constructor() {
      super();
      this.longTextSize = 100;
      this.text = "";
      this.type = AltType.Span;
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

  // src/alt_nodes/builder.js
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

  // code.js
  var LOCAL_UI_URL = "https://local.adobe.com/plugin/ui.html";
  console.log(`\u{1F680} Loading UI from localhost: ${LOCAL_UI_URL}`);
  figma.showUI(`<script>window.location.href = "${LOCAL_UI_URL}"<\/script>`, {
    width: 450,
    height: 650,
    title: "Figma to Odin Plugin"
  });
  figma.ui.onmessage = (message) => {
    console.log("\u{1F4E8} Message received from localhost UI:", message);
    switch (message.type) {
      case "ui-ready":
        console.log("\u2705 UI is ready and connected!");
        figma.ui.postMessage({
          type: "plugin-ready",
          data: {
            selection: figma.currentPage.selection.length,
            pageName: figma.currentPage.name,
            message: "Connected to localhost! \u{1F389}"
          }
        });
        sendCurrentSelectionData();
        break;
      case "describeSelectedLayer":
        console.log("Request to describe layer received (manual trigger).");
        sendCurrentSelectionData();
        break;
      case "close":
        console.log("\u{1F44B} Closing plugin...");
        figma.closePlugin();
        break;
      default:
        console.log("\u2753 Unknown message type:", message.type);
    }
  };
  figma.on("selectionchange", () => {
    console.log("\u{1F3A8} Figma selection changed.");
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
        payload: altNode.toJson()
      });
    } else if (selection.length === 0) {
      console.log("No layer selected.");
      figma.ui.postMessage({
        type: "layerData",
        payload: void 0
      });
    } else {
      console.log("Multiple layers selected.");
      figma.ui.postMessage({
        type: "layerData",
        payload: void 0
      });
    }
  }
  console.log(
    "\u{1F527} Plugin started - make sure your localhost server is running on port 3000!"
  );
})();
