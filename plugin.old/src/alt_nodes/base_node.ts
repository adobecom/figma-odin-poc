import { fromFigmaNode } from "./builder.js";

enum AltType {
    Div = 'div',
    Span = 'span',
}

type CFField = {
    top_left_corner: { x: number, y: number };
    name: string;
    label: string;
    type: string;
    required: boolean;
    multiple: boolean;
    value?: unknown;
    items?: string[];
}

class AltBaseNode {
    type: AltType = AltType.Div;
    figmaId: string;
    cfId: string | null;
    cfModelId: string | null;
    name: string;
    css: Record<string, string>;
    children: AltBaseNode[];
    top_left_corner: { x: number, y: number };

    constructor() {
        this.figmaId = "";
        this.name = "";
        this.css = {};
        this.children = [];
        this.top_left_corner = { x: 0, y: 0 };
        this.cfId = null;
        this.cfModelId = null;
    }

    setFragment(id: string) {
        this.cfId = id;
    }

    setFragmentModel(id: string) {
        this.cfModelId = id;
    }

    async fromFigmaNode(node: BaseNode) {
        this.figmaId = node.id;
        this.name = node.name.replaceAll(' ', '-').toLowerCase();
        this.css = await node.getCSSAsync();

        this.top_left_corner = {
            x: node.absoluteBoundingBox.x,
            y: node.absoluteBoundingBox.y
        };

        if (node.children) {
            this.children = [];
            for (const child of node.children) {
                const altNode = await fromFigmaNode(child); // Call the function
                this.children.push(altNode); // Push the resulting AltBaseNode object
            }
        }
    }

    toCSS(parentClassName: string = '', isHead: boolean = false) {
        let css = '';
        const className = isHead ? `.${this.name}` : `${parentClassName} > .${this.name}`;
        if (this.css) {
            css += `${parentClassName} {\n`;
            for (const key in this.css) {
                css += `    ${key}: ${this.css[key]};\n`;
            }
            css += '}\n\n';
        }
        if (this.children) {
            for (const child of this.children) {
                css += child.toCSS(`${className}`);
            }
        }
        return css
    }

    toJson(): Record<string, unknown>{
        return {
            type: this.type,
            name: this.name,
            css: this.css,
            children: this.children.map(child => child.toJson())
        }
    }

    toField(): CFField | null {
        return null;
    }

    getFields(list: CFField[], isRoot: boolean = false) {
        const field = this.toField();
        if (field) {
            list.push(field);
        }
        for (const child of this.children) {
            child.getFields(list, false);
        }
    }

    getFieldsSorted(): CFField[] {
        const fields: CFField[] = [];
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
        const fields: CFField[] = this.getFieldsSorted();

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
            "configurationFolder": "/conf/sandbox",
            "description": `${this.name} model generated from Figma`,
            "locked": "false",
            "status": "enabled"
          }
    }
}

export { AltBaseNode, AltType, CFField };