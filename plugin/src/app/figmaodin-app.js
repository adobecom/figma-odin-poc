import { LitElement, html, nothing, css } from "https://cdn.skypack.dev/lit";
import { transformPayloadWithFigmaData } from "../../dist/bundle.js";
import { createContentFragmentPayload } from "./knowladge.js";

class FigmaodinApp extends LitElement {
  static properties = {
    layerData: { type: String },
    accessToken: { type: String, state: true },
    bucket: { type: String, reflect: true },
    models: { type: Array, state: true },
    selectedModelId: { type: String, state: true },
    hasOdinPath: { type: Boolean, state: true },
    odinPath: { type: String, state: true },
  };

  constructor() {
    super();
    this.layerData = null;
    this.accessToken = localStorage.getItem("accessToken") || null;
    this.bucket = "author-p22655-e59341";
    this.models = [];
    this.selectedModelId = "";
    this.hasOdinPath = false;
    this.odinPath = null;
  }

  get hasValidLayerSelection() {
    return this.layerData !== null;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    sp-textfield {
      width: 100%;
    }

    #resetIMSTokenBtn {
      position: absolute;
      bottom: 10px;
      right: 10px;
    }
  `;

  get selectedModel() {
    return this.models.find((model) => model.id === this.selectedModelId);
  }

  get createContentFragmentModelButton() {
    if (this.selectedModelId || !this.layerData) return nothing;
    return html`
      <sp-button
        variant="accent"
        @click=${this.onCreateContentFragmentModelClick}
      >
        Create Content Fragment Model
      </sp-button>
    `;
  }

  get createContentFragmentButton() {
    if (!this.selectedModelId || !this.layerData || this.hasOdinPath)
      return nothing;
    return html`
      <sp-button variant="accent" @click=${this.onCreateContentFragmentClick}>
        Create Content Fragment
      </sp-button>
    `;
  }

  render() {
    if (!this.accessToken) {
      return html`
        <div>
          <sp-field-label for="accessTokenInput"
            >IMS Access Token:</sp-field-label
          >
          <sp-textfield
            id="accessTokenInput"
            multiline
            placeholder="Paste your IMS Access Token here"
            style="margin-bottom: 15px;"
          ></sp-textfield>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <sp-button variant="primary" @click=${this.signIn}>
              1. Open Odin login page
            </sp-button>
            <sp-button variant="primary" @click=${this.submitTokens}>
              2. Store token
            </sp-button>
          </div>
        </div>
      `;
    }

    return html`
      ${
        this.models && this.models.length > 0
          ? html`
              <sp-field-label for="model-picker"
                >Select a Model:</sp-field-label
              >
              <sp-picker
                id="model-picker"
                @change=${this._handleModelChange}
                .value=${this.selectedModelId || ""}
              >
                <sp-menu-item value=""></sp-menu-item>
                ${this.models.map(
                  (model) => html`
                    <sp-menu-item value=${model.id}>${model.name}</sp-menu-item>
                  `
                )}
              </sp-picker>
              ${this.createContentFragmentButton}
              ${this.createContentFragmentModelButton}
            `
          : ""
      }
      </div>
      <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start;">
        <sp-button id="resetIMSTokenBtn" variant="warning" @click=${
          this.resetTokens
        }>
          Reset tokens
        </sp-button>
      </div>
    `;
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("accessToken")) {
      this.storeAccessToken(this.accessToken);
      if (this.accessToken) {
        this.listCFModels();
      } else {
        this.models = [];
        this.selectedModelId = "";
      }
    }
  }

  storeAccessToken(accessToken) {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }
  }

  resetTokens() {
    localStorage.removeItem("accessToken");
    this.accessToken = null;
    console.log("Tokens reset.");
  }

  async listCFModels() {
    const queryParams = new URLSearchParams({
      query: JSON.stringify({
        filter: {
          configurationFolder: "/conf/sandbox",
        },
      }),
    });
    const queryString = queryParams.toString();

    try {
      const resp = await fetch(
        `https://${this.bucket}.adobeaemcloud.com/adobe/sites/cf/models/search?${queryString}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!resp.ok) {
        console.error(
          "Failed to fetch models:",
          resp.status,
          await resp.text()
        );
        this.models = [];
        localStorage.removeItem("accessToken");
        this.accessToken = null;
        return;
      }
      const data = await resp.json();
      this.models = data.items || [];
    } catch (error) {
      console.error("Error fetching models:", error);
      this.models = [];
      localStorage.removeItem("accessToken");
      this.accessToken = null;
    }
  }

  submitTokens() {
    const imsInputElement = this.shadowRoot.getElementById("accessTokenInput");

    if (imsInputElement && imsInputElement.value) {
      this.accessToken = imsInputElement.value;
      console.log("IMS Access token submitted.");
    } else {
      window.alert("IMS Access Token is required.");
      console.log("Token submission failed: token missing.");
      // Do not update this.accessToken, keeping the user on the input screen
    }
  }

  signIn() {
    window.open("login.html", "_blank");
  }

  onDescribeLayerClick() {
    console.log("UI: Requesting layer description...");
    parent.postMessage(
      {
        pluginMessage: {
          type: "describeSelectedLayer", // New message type
        },
        pluginId: "FIGMAODIN_PLUGIN_ODIN_POC",
      },
      "*"
    );
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("message", this.handleMessage.bind(this)); // Bind `this`
    console.log("FigmaodinApp connected and listening for messages.");
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("message", this.handleMessage.bind(this)); // Bind `this`
    console.log(
      "FigmaodinApp disconnected and stopped listening for messages."
    );
  }

  handleMessage(event) {
    if (event.data.pluginMessage) {
      console.log(
        "UI: Message received from plugin code:",
        event.data.pluginMessage
      );
      const { type, payload, data } = event.data.pluginMessage;

      if (type === "layerData") {
        if (payload === undefined) {
          // Handle cases where no layer is selected or multiple layers are selected
          this.layerData = null;
          this.hasOdinPath = false;
          this.odinPath = null;
          console.log(
            "Invalid selection (none or multiple), layerData set to null."
          );
        } else {
          // This is actual layer data from a single selected layer
          this.layerData = JSON.stringify(payload, null, 2);

          let foundOdinPath = null;
          if (Array.isArray(payload)) {
            const metadataNode = payload.find(
              (item) =>
                item.key === "pluginMetadata" &&
                typeof item.value === "object" &&
                item.value !== null
            );
            foundOdinPath =
              metadataNode?.value?.FIGMAODIN_PLUGIN_ODIN_POC?.path;
            if (!foundOdinPath) {
              const directPluginMeta =
                payload?.pluginMetadata?.FIGMAODIN_PLUGIN_ODIN_POC;
              if (directPluginMeta && directPluginMeta.path) {
                foundOdinPath = directPluginMeta.path;
              }
            }
          }

          if (foundOdinPath) {
            this.hasOdinPath = true;
            this.odinPath = foundOdinPath;
            console.log("Odin path found and stored:", this.odinPath);
          } else {
            this.hasOdinPath = false;
            this.odinPath = null;
            if (Array.isArray(payload) && payload.length > 0) {
              console.log("Odin path NOT found in received layer metadata.");
            }
          }
        }
      } else if (type === "plugin-ready") {
        this.pluginMessagePayload = data?.message || "Plugin is ready.";
      }
    }
  }

  _handleModelChange(event) {
    this.selectedModelId = event.target.value;
    console.log("Selected model ID:", this.selectedModelId);
    // You can perform further actions here if needed when a model is selected
  }

  async onCreateContentFragmentClick() {
    const newPayload = await transformPayloadWithFigmaData(
      createContentFragmentPayload,
      this.selectedModel,
      this.layerData
    );
    console.log("New payload:", newPayload);
  }

  onOpenInOdinClick() {
    console.log(
      "UI: 'Open in Odin' button clicked. Selected model ID:",
      this.selectedModelId
    );
    // Placeholder for actual functionality
  }
}

customElements.define("figmaodin-app", FigmaodinApp);
