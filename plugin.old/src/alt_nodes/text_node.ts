import { AltBaseNode, AltType, CFField } from "./base_node.js";

class AltTextNode extends AltBaseNode {
    readonly longTextSize: number = 100;
    text: string;

    constructor() {
        super();
        this.text = "";
        this.type = AltType.Span;
    }

    async fromFigmaNode(node: BaseNode) {
        await super.fromFigmaNode(node);
        this.text = (node as TextNode).characters;
    }

    toJson(): Record<string, unknown> {
        return {
            type: this.type,
            name: this.name,
            css: this.css,
            children: this.children.map(child => child.toJson()),
            text: this.text
        };
    }

    toField(): CFField | null {
        const textType = this.text.length > this.longTextSize ? 'long-text' : 'text';

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