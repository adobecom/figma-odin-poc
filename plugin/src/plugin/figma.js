export function flattenFigmaTextLayers(layer) {
  const flattened = {};
  
  function recurse(currentNode, acc) {
    if (!currentNode || currentNode.visible === false || currentNode.opacity === 0) {
      return;
    }

    if (currentNode.type === "TEXT" && currentNode.name && typeof currentNode.characters === 'string') {
      // If multiple text layers have the same name, the last one processed will overwrite previous ones.
      // Consider a different strategy (e.g., appending a suffix or storing values in an array)
      // if unique names are not guaranteed or if all values for a repeated name are needed.
      acc[currentNode.name] = currentNode.characters;
    }

    if (currentNode.children && Array.isArray(currentNode.children)) {
      
      for (const child of currentNode.children) {
        recurse(child, acc);
      }
    }
  }

  recurse(layer, flattened);
  return flattened;
}
