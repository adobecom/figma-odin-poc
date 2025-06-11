import { AltBaseNode } from "./base_node.js";
import { cFragments } from "../odin.js";

class AltFragmentNode extends AltBaseNode {
    constructor() {
        super();
        this.path = "";
        this.modelId = "";
    }

    async fromFigmaNode(node) {
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

    toJson() {
        return {
            type: this.type,
            name: this.name,
            css: this.css,
            children: this.children.map(child => child.toJson()),
            path: this.path
        };
    }

    toField() {
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
}

export { AltFragmentNode };