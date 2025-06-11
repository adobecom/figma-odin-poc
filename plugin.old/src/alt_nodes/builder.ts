import { AltAssetNode } from "./asset_node.js";
import { AltBaseNode } from "./base_node.js";
import { AltFragmentNode } from "./fragment_node.js";
import { AltTextNode } from "./text_node.js";

async function fromFigmaNode(node: BaseNode): Promise<AltBaseNode> {
    let altNode;
    if (node.getPluginData('fragmentId')) {
        altNode = new AltFragmentNode();
        console.log('FRAGMENT NODE');
    } else if (node.type === 'TEXT') {
        altNode = new AltTextNode();
        console.log('TEXT NODE');
    } else if (node.type === 'RECTANGLE' && node.fills.length > 0 && node.fills[0].type === 'IMAGE') {
        altNode = new AltAssetNode();
        console.log('ASSET NODE');
    } else {
        altNode = new AltBaseNode();
        console.log('BASE NODE');
    }
    await altNode.fromFigmaNode(node);
    return altNode;
}

export { fromFigmaNode };