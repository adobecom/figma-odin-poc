import { AltBaseNode } from "./base_node.js";

class AltAssetNode extends AltBaseNode {
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
      src: this.src,
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
      value: this.src,
    };
  }
}

export { AltAssetNode };
