import { AltBaseNode, CFField } from "./base_node.js";

class AltAssetNode extends AltBaseNode {
    src: string;

    constructor() {
        super();
        this.src = "";
    }

    async fromFigmaNode(node: BaseNode): Promise<void> {
        await super.fromFigmaNode(node);
        this.src = "https://via.placeholder.com/150";
        return Promise.resolve();
    }

    toJson(): Record<string, unknown> {
        return {
            type: this.type,
            name: this.name,
            css: this.css,
            children: this.children.map(child => child.toJson()),
            src: this.src
        };
    }

    toField(): CFField | null {
        return {
            top_left_corner: this.top_left_corner,
            name: this.name,
            label: this.name,
            type: 'content-reference',
            required: false,
            multiple: false,
            value: this.src
        };
    }
}

export { AltAssetNode };