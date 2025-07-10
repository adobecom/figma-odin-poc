const AemURL = "https://author-p22655-e59341.adobeaemcloud.com/adobe/sites/cf/";

let accessToken = localStorage.getItem("accessToken") || "";
const eTags = {};
const cFragments = {};

// Store current node data
let currentNodeData = null;

// DOM elements - will be initialized after DOM loads
let tokenSection, tokenInput, saveTokenButton, validMainContentDivs;

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function loadFragmentsInUI() {
  if (!accessToken) {
    console.log("No access token available for loading fragments");
    return;
  }

  try {
    const response = await fetch(`${AemURL}fragments`, {
      headers: getHeaders(),
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const fragments = data.items || [];

    for (const fragment of fragments) {
      cFragments[fragment.id] = fragment;
      eTags[fragment.id] = fragment.etag;
    }

    console.log(`Loaded ${fragments.length} fragments from AEM`);
  } catch (error) {
    console.error("Error loading fragments:", error);
  }
}

async function createCfModel(altNodeJson, modelName) {
  const fields = altNodeJson.fields || [];

  const payload = {
    models: [
      {
        name: modelName || altNodeJson.name,
        fields: fields.map((field) => {
          const fieldData = {
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            multiple: field.multiple,
          };
          if (field.items) {
            fieldData.items = field.items;
          }
          return fieldData;
        }),
        configurationFolder: "/conf/sandbox/figmapoc",
        description: "Model generated from Figma",
        locked: "false",
        status: "enabled",
      },
    ],
  };

  console.log("Creating model with data: ", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${AemURL}models`, {
      headers: getHeaders(),
      body: JSON.stringify(payload),
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      throw new Error("No items returned from the server");
    }

    const modelId = data.items[0].id;

    // Fetch the complete model details
    const modelResponse = await fetch(`${AemURL}models/${modelId}`, {
      headers: getHeaders(),
      method: "GET",
    });

    if (!modelResponse.ok) {
      throw new Error(`HTTP error! status: ${modelResponse.status}`);
    }

    const model = await modelResponse.json();
    console.log("Model created: ", model);

    // Update UI dropdown and notify plugin code
    await loadModelsInUI();

    window.parent.postMessage(
      {
        pluginMessage: {
          type: "modelCreated",
          model: model,
        },
      },
      "*"
    );

    showSuccessMessage("Model created successfully");
    return model;
  } catch (error) {
    console.error("Error creating model:", error);
    showErrorMessage("An error occurred while creating the model");
    throw error;
  }
}

async function createContentFragment(altNodeJson, fragmentName, modelId) {
  const fields = altNodeJson.fields || [];
  const models = JSON.parse(localStorage.getItem("models") || "[]");
  const model = models.find((m) => m.id === modelId);

  if (!model) {
    throw new Error("Model not found");
  }

  const newFields = fields
    .map((field, index) => {
      const existingField = model.fields[index];
      if (!existingField) {
        return null;
      }

      return {
        name: existingField.name,
        type: existingField.type,
        multiple: existingField.multiple,
        values: [field.value],
      };
    })
    .filter((field) => field !== null);

  const payload = {
    title: fragmentName,
    name: fragmentName,
    description: "Fragment generated from Figma",
    modelId: modelId,
    parentPath: "/content/dam/sandbox/figmapoc",
    fields: newFields,
  };

  console.log(
    "Creating fragment with data: ",
    JSON.stringify(payload, null, 2)
  );

  try {
    const response = await fetch(`${AemURL}fragments`, {
      headers: getHeaders(),
      body: JSON.stringify(payload),
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const fragment = await response.json();
    const eTag = response.headers.get("etag");

    if (!fragment.id) {
      throw new Error("No fragment ID returned from the server");
    }

    eTags[fragment.id] = eTag;
    cFragments[fragment.id] = fragment;

    window.parent.postMessage(
      {
        pluginMessage: {
          type: "fragmentCreated",
          fragment: fragment,
          modelId: modelId,
        },
      },
      "*"
    );

    showSuccessMessage("Fragment created successfully");
    return fragment;
  } catch (error) {
    console.error("Error creating fragment:", error);
    showErrorMessage("An error occurred while creating the fragment");
    throw error;
  }
}

async function modifyContentFragment(altNodeJson, fragmentId, fragmentName) {
  const fields = altNodeJson.fields || [];
  const existingFragment = cFragments[fragmentId];

  if (!existingFragment) {
    throw new Error("Fragment not found");
  }

  const existingFields = existingFragment.fields;

  const newFields = fields
    .map((field, index) => {
      const existingField = existingFields[index];
      if (!existingField) {
        return null;
      }

      // TODO: Support repeated fields
      existingField.values = [field.value];
      return existingField;
    })
    .filter((field) => field !== null);

  const payload = {
    title: fragmentName,
    fields: newFields,
  };

  console.log(
    "Modifying fragment with data: ",
    JSON.stringify(payload, null, 2)
  );

  try {
    const headers = getHeaders();
    headers["If-Match"] = eTags[fragmentId] || "";

    const response = await fetch(`${AemURL}fragments/${fragmentId}`, {
      headers: headers,
      body: JSON.stringify(payload),
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const fragment = await response.json();
    const eTag = response.headers.get("etag");

    if (!fragment.id) {
      throw new Error("No fragment ID returned from the server");
    }

    eTags[fragment.id] = eTag;
    cFragments[fragment.id] = fragment;

    window.parent.postMessage(
      {
        pluginMessage: {
          type: "fragmentModified",
          fragment: fragment,
        },
      },
      "*"
    );

    showSuccessMessage("Fragment modified successfully");
    return fragment;
  } catch (error) {
    console.error("Error modifying fragment:", error);
    showErrorMessage("An error occurred while modifying the fragment");
    throw error;
  }
}

async function deleteContentFragment(fragmentId) {
  try {
    const headers = getHeaders();
    headers["If-Match"] = eTags[fragmentId] || "";

    const response = await fetch(`${AemURL}fragments/${fragmentId}`, {
      headers: headers,
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    delete cFragments[fragmentId];
    delete eTags[fragmentId];

    window.parent.postMessage(
      {
        pluginMessage: {
          type: "fragmentDeleted",
          fragmentId: fragmentId,
        },
      },
      "*"
    );

    showSuccessMessage("Fragment deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting fragment:", error);
    showErrorMessage("An error occurred while deleting the fragment");
    throw error;
  }
}

async function loadModelsInUI() {
  if (!accessToken) {
    console.log("No access token available for loading models");
    return;
  }

  try {
    const response = await fetch(
      `${AemURL}models?enabledForFolder=%2Fcontent%2Fdam%2Fsandbox%2Ffigmapoc`,
      { headers: getHeaders(), method: "GET" }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const models = data.items || [];

    // Store models in localStorage for use in fragment creation
    localStorage.setItem("models", JSON.stringify(models));

    // Update the UI dropdown
    const cfmList = document.getElementById("cfmList");

    // Clear the list
    while (cfmList.firstChild) {
      cfmList.removeChild(cfmList.firstChild);
    }

    const startOption = document.createElement("option");
    startOption.value = "";
    startOption.textContent = "Select an option";
    cfmList.appendChild(startOption);

    // Add an option for each model
    models.forEach((model) => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.name;
      cfmList.appendChild(option);
    });

    // Add an option for creating a new Content Fragment Model
    const createOption = document.createElement("option");
    createOption.value = "createCFM";
    createOption.textContent = "Create Content Fragment Model";
    cfmList.appendChild(createOption);

    // Send models to the plugin code
    window.parent.postMessage(
      {
        pluginMessage: {
          type: "initialModelsLoaded",
          models: models,
        },
      },
      "*"
    );

    console.log(`Loaded ${models.length} models from AEM`);
  } catch (error) {
    console.error("Error loading models:", error);
    showErrorMessage("Failed to load content fragment models");
  }
}

function showSuccessMessage(message) {
  document.getElementById("alert-success").removeAttribute("hidden");
  document.getElementById("success-message").textContent = message;
  window.scrollTo(0, 0);
  setTimeout(() => {
    document.getElementById("alert-success").setAttribute("hidden", "true");
  }, 5000);
}

function showErrorMessage(message) {
  document.getElementById("alert-error").removeAttribute("hidden");
  document.getElementById("error-message").textContent = message;
  window.scrollTo(0, 0);
  setTimeout(() => {
    document.getElementById("alert-error").setAttribute("hidden", "true");
  }, 5000);
}

function toggleMainContent(show) {
  validMainContentDivs.forEach((div) => {
    // Check if the div is the h2 title itself, and avoid hiding it if we want to show content
    if (
      div.tagName === "H2" &&
      div.textContent === "AEM Content Manager" &&
      show
    ) {
      // no-op, h2 should always be visible or managed by token section logic
    } else {
      div.style.display = show ? "" : "none";
    }
  });
  // Also hide/show the main H2 title based on token status
  const mainH2 = document.querySelector("h2");
  if (mainH2) {
    mainH2.style.display = show ? "" : "none";
  }
}

function checkToken() {
  if (!accessToken) {
    tokenSection.style.display = "block";
    toggleMainContent(false);
  } else {
    tokenSection.style.display = "none";
    toggleMainContent(true);
    // Load models and fragments when token is available
    loadModelsInUI();
    loadFragmentsInUI();
  }
}

function initializeDOMElements() {
  tokenSection = document.getElementById("tokenSection");
  tokenInput = document.getElementById("tokenInput");
  saveTokenButton = document.getElementById("saveTokenButton");
  
  const mainContentDivs = [
    document.querySelector("h2").nextElementSibling, // alert-success
    document.querySelector("h2").nextElementSibling.nextElementSibling, // alert-error
    document.getElementById("cfName").closest("div").previousElementSibling
      .previousElementSibling.previousElementSibling, // Debug (commented out)
    document.getElementById("cfName").closest("div").previousElementSibling
      .previousElementSibling, // Content Fragment h3
    document.getElementById("cfName").closest("div").previousElementSibling, // Content Fragment p + input
    document.getElementById("cfName").closest("div"), // Content Fragment action-buttons
    document.getElementById("cfmList").closest("div").previousElementSibling, // Content Fragment Models h3
    document.getElementById("cfmList").closest("div"), // Content Fragment Models select
    document.getElementById("cfmCreationPanel"), // cfmCreationPanel
  ];
  // Filter out null elements if any (like the commented out Debug div)
  validMainContentDivs = mainContentDivs.filter((el) => el);
}

function setupEventListeners() {
  // Save token button
  saveTokenButton.addEventListener("click", () => {
    const tokenValue = tokenInput.value.trim();
    if (tokenValue) {
      accessToken = tokenValue;
      localStorage.setItem("accessToken", accessToken);
      window.parent.postMessage(
        { pluginMessage: { type: "save-token", token: accessToken } },
        "*"
      );
      checkToken(); // Re-evaluate UI state and load models
      // Show success message
      showSuccessMessage("Token saved successfully!");
    } else {
      // Show error message
      showErrorMessage("Token cannot be empty.");
    }
  });

  // Content Fragment Model dropdown
  document.getElementById("cfmList").addEventListener("change", function (e) {
    const cfmCreationPanel = document.getElementById("cfmCreationPanel");
    if (e.target.value === "createCFM") {
      cfmCreationPanel.style.display = "block";
    } else {
      cfmCreationPanel.style.display = "none";
    }
  });

  // Submit Content Fragment Model button
  document.getElementById("submitCFM").addEventListener("click", function () {
    const modelName = document.getElementById("cfmName").value;
    if (!modelName.trim()) {
      showErrorMessage("Model name cannot be empty");
      return;
    }
    
    if (!currentNodeData || !currentNodeData.altNode) {
      showErrorMessage("Please select a node first");
      return;
    }
    
    // Create CFM directly with stored node data
    createCfModel(currentNodeData.altNode, modelName).catch(console.error);
  });

  // Create Content Fragment button
  document.getElementById("createCF").addEventListener("click", function () {
    const cfName = document.getElementById("cfName").value;
    const cfmId = document.getElementById("cfmList").value;
    
    if (!cfName.trim()) {
      showErrorMessage("Fragment name cannot be empty");
      return;
    }
    
    if (!cfmId || cfmId === "createCFM") {
      showErrorMessage("Please select a valid Content Fragment Model");
      return;
    }
    
    if (!currentNodeData || !currentNodeData.altNode) {
      showErrorMessage("Please select a node first");
      return;
    }
    
    // Create CF directly with stored node data
    createContentFragment(currentNodeData.altNode, cfName, cfmId).catch(console.error);
  });

  // Modify Content Fragment button
  document.getElementById("modifyCF").addEventListener("click", function () {
    const fragmentName = document.getElementById("cfName").value;
    
    if (!fragmentName.trim()) {
      showErrorMessage("Fragment name cannot be empty");
      return;
    }
    
    if (!currentNodeData || !currentNodeData.altNode) {
      showErrorMessage("Please select a node first");
      return;
    }
    
    // Get fragmentId from current selection data
    const fragmentId = currentNodeData.fragmentId;
    if (!fragmentId) {
      showErrorMessage("No fragment ID found for the selected node");
      return;
    }
    
    // Modify CF directly with stored node data
    modifyContentFragment(currentNodeData.altNode, fragmentId, fragmentName).catch(console.error);
  });

  // Delete Content Fragment button
  document.getElementById("deleteCF").addEventListener("click", function () {
    if (!currentNodeData) {
      showErrorMessage("Please select a node first");
      return;
    }
    
    const fragmentId = currentNodeData.fragmentId;
    if (!fragmentId) {
      showErrorMessage("No fragment ID found for the selected node");
      return;
    }
    
    if (confirm("Are you sure you want to delete this content fragment?")) {
      deleteContentFragment(fragmentId).catch(console.error);
    }
  });
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener("DOMContentLoaded", function() {
  initializeDOMElements();
  setupEventListeners();
  
  // Initial check when the DOM is ready
  checkToken();
  
  // Load models initially
  loadModelsInUI();
  
  console.log("ui.js DOM loaded and initialized");
});

window.onmessage = (event) => {
  if (!event.data.pluginMessage) {
    return;
  }

  const msg = event.data.pluginMessage;

  if (msg.type === "loadModels") {
    const models = msg.models;
    const cfmList = document.getElementById("cfmList");

    // Clear the list
    while (cfmList.firstChild) {
      cfmList.removeChild(cfmList.firstChild);
    }

    const startOption = document.createElement("option");
    startOption.value = "";
    startOption.textContent = "Select an option";
    cfmList.appendChild(startOption);

    // Add an option for each model
    models.forEach((model) => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.name;
      cfmList.appendChild(option);
    });

    // Add an option for creating a new Content Fragment Model
    const createOption = document.createElement("option");
    createOption.value = "createCFM";
    createOption.textContent = "Create Content Fragment Model";
    cfmList.appendChild(createOption);
  } else if (msg.type === "nodeSelected") {
    // Store the node data globally
    currentNodeData = {
      altNode: msg.altNode,
      modelId: msg.modelId,
      fragmentId: msg.fragmentId,
      fragmentName: msg.fragmentName
    };
    
    const cfmList = document.getElementById("cfmList");
    const fragmentName = msg.fragmentName;

    if (fragmentName) {
      document.getElementById("cfName").value = fragmentName;
      document.getElementById("createCF").disabled = true;
    } else {
      document.getElementById("cfName").value = "";
      document.getElementById("createCF").disabled = false;
    }

    // Select the corresponding option in the list
    cfmList.value = msg.modelId;
    cfmList.dispatchEvent(new Event("change"));

    // Initial check to set up UI based on token presence
    checkToken();
  } else if (msg.type === "error") {
    showErrorMessage(msg.message);
  } else if (msg.type === "success") {
    showSuccessMessage(msg.message);
  }
};