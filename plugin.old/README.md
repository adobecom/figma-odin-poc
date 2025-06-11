# AEM Figma Plugin

This repository hosts a Figma plugin under development, designed to integrate Figma with Adobe Experience Manager (AEM). The primary functionality of this plugin is to manage AEM content fragment models and content fragments directly within Figma, enabling creation, editing, and deletion of these fragments and the creation of models.

**NOTE:** This plugin is still in development and is not yet available in the Figma plugin store.

### Table of Contents

- [Setup the plugin locally](#setup)
- [Usage](#usage)

## Setup

To setup the plugin locally, follow these steps:

### Prerequisites

- You will need to have [**Node.js**](https://nodejs.org/en/) installed on your machine.
- You will need to have [**Figma Desktop**](https://www.figma.com/downloads/) installed on your machine.
- You will need to have a **local instance** of **AEM** running on your machine. If you are not sure how to do that a quick solution is to clone [this](https://git.corp.adobe.com/CQ/quickstart) repository and follow the instructions in the README file.
- You will need to setup the **proxy server** to communicate with AEM. To do that, follow the instructions in the [proxy-server](./proxy_server/README.md) directory.


### Steps

#### 1. Install the dependencies by running the following command in the root directory of the project:

```bash
npm install
```

#### 2. Start the local development server in AEM on port 4502 (*default*). If you are using a different port, update the `proxy_server/.proxyrc.js` file with the correct port.


#### 3. Start the proxy server by running the following command in the `proxy_server` directory:

```bash
yarn start
```

#### 4. Open Figma Desktop and import the plugin by following these steps: `Top Left Corner button` -> `Plugins` -> `Development` -> `Import plugin from manifest...` and select the `manifest.json` file from the root directory of the project. **NOTE**: Only need to do this once.

#### 5. Start the plugin by following these steps: `Top Left Corner button` -> `Plugins` -> `Development` -> `AEM Figma Plugin`.

## Usage

Comeon, it's really intuitive, figure it out. 😄