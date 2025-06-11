import { AltBaseNode, AltType } from "./base_node.js";

class AltTextNode extends AltBaseNode {
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
      text: this.text,
    };
  }

  toField() {
    const textType =
      this.text.length > this.longTextSize ? "long-text" : "text";

    return {
      top_left_corner: this.top_left_corner,
      name: this.name,
      label: this.name,
      type: textType,
      required: false,
      multiple: false,
      value: this.text,
    };
  }
}

export { AltTextNode };
