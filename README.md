![Deploy Pages](https://github.com/lukejcollins/johncollins-art.co.uk/actions/workflows/deploy-pages.yml/badge.svg) ![Deploy Worker](https://github.com/lukejcollins/johncollins-art.co.uk/actions/workflows/deploy-worker.yml/badge.svg)


# John Collins Art Gallery

This is a simple web application built using HTML, CSS, JavaScript, Bootstrap, and GitHub Actions and hosted on Cloudflare Pages. The gallery showcases a collection of my late uncle's art.

## Features

- **Responsive Design**: Optimised for both desktop and mobile devices.
- **Dynamic Image Loading**: Image URLs are fetched from the [Cloudinary](https://www.cloudinary.com/) where the images are hosted.
- **Bootstrap Integration**: Utilises Bootstrap for styling and responsive components.
- **Interactive Navigation**: Includes buttons to navigate through images in the gallery and modal view, as well as keyboard and touch screen navigation.
- **GitHub Actions CI/CD**: Automatically builds and deploys the application when changes are pushed to the main branch.

## Prerequisites for local development

- Node.js

## Setup local development environment

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/lukejcollins/john-collins-art.git
   cd john-collins-art
   ```

2. **Set up secrets file in** ```./worker/winter-star-ad97/.dev.vars```:
   ```bash
   CLOUDINARY_API_KEY=***
   CLOUDINARY_API_SECRET=***
   ```

3. **Run the Page locally from the root directory**:
   ```bash
   npx wrangler pages dev ./pages
   ```

4. **Run the Worker locally from the** ```./worker/winter-star-ad97/``` **folder**:
   ```bash
   npx wrangler dev
   ```

## GitHub Actions

The repository includes GitHub Actions workflows to automate the build and deployment process:

- **Page Deployment Worker**: `.github/workflows/deploy-pages.yml`
  - Runs on every push to the main branch where the pages directory is modified.

- **Worker Deployment Workflow**: `.github/workflows/deploy-worker.yml`
  - Runs on every push to the main branch where the worker directory is modified.

## License

This project is licensed under the MIT License.
