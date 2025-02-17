# John Collins Art Gallery

This is a simple web application built using HTML, CSS, JavaScript, Bootstrap, and GitHub Actions and hosted on Cloudflare Pages. The gallery showcases a collection of my late uncle's art.

## Features

- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Dynamic Image Loading**: Images are fetched from an external API (e.g., [Cloudinary](https://www.cloudinary.com/)).
- **Bootstrap Integration**: Utilizes Bootstrap for styling and responsive components.
- **Interactive Navigation**: Includes buttons to navigate through images in the gallery and modal view.
- **GitHub Actions CI/CD**: Automatically builds and deploys the application when changes are pushed to the main branch.

## Prerequisites for local development

- Node.js

## Setup local developmen environment

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/lukejcollins/john-collins-art.git
   cd john-collins-art
   ```

3. **Run the Page locally**:
   ```bash
   npx wrangler pages dev ./pages
   ```
   Run this from the root directory.

4. **Run the Worker locally**:
   ```bash
   npx wrangler dev
   ```
   Run this from the ./worker/winter-star-ad97/ folder.

## GitHub Actions

The repository includes GitHub Actions workflows to automate the build and deployment process:

- **Page Deployment Worker**: `.github/workflows/deploy-pages.yml`
  - Runs on every push to the main branch where the pages directory is modified.

- **Worker Deployment Workflow**: `.github/workflows/deploy-worker.yml`
  - Runs on every push to the main branch where the worker directory is modified.

## License

This project is licensed under the MIT License.
