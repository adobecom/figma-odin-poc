# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.aem.page/
- Live: https://main--{repo}--{owner}.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

Requirements:
- Figma Desktop


## Local development

1. add `127.0.0.1	localhost local.adobe.com` to your `/etc/hosts` file
2. generate the certificates for the local development server
- local.adobe.com.pem
- local.adobe.com-key.pem
3. start the server with `npm start`
4. run `sudo socat TCP-LISTEN:443,fork TCP:localhost:3000`  in a shell.
5. Install the plugin in Figma using the manifest at `plugin/manifest.json`