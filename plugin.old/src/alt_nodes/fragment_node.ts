import { AltBaseNode, CFField } from "./base_node.js";
import { cFragments } from "../code.js";

class AltFragmentNode extends AltBaseNode {
    path: string;
    modelId: string;

    constructor() {
        super();
        this.path = "";
        this.modelId = "";
    }

    async fromFigmaNode(node: BaseNode) {
        await super.fromFigmaNode(node);

        const fragmentId = node.getPluginData('fragmentId');
        if (fragmentId && (fragmentId in cFragments)) {
            this.path = cFragments[fragmentId].path;
            this.modelId = cFragments[fragmentId].model.id;
        } else {
            this.path = "";
            this.modelId = "";
        }
    }

    toJson(): Record<string, unknown> {
        return {
            type: this.type,
            name: this.name,
            css: this.css,
            children: this.children.map(child => child.toJson()),
            path: this.path
        };
    }

    toField(): CFField | null {
        return {
            top_left_corner: this.top_left_corner,
            name: this.name,
            label: this.name,
            type: 'content-fragment',
            required: false,
            multiple: false,
            items: [this.modelId],
            value: this.path
        };
    }

    getFields(list: CFField[], isRoot: boolean) {
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
}

export { AltFragmentNode };