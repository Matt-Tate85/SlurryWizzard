# AHDB Slurry Wizard

The AHDB Slurry Wizard is a web application that helps farmers identify whether there is adequate slurry storage and explore different strategies to meet compliance. It provides calculations for storage capacity, nitrogen loading, and recommendations based on farm data.

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ahdb-slurry-wizard.git
cd ahdb-slurry-wizard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Build for production:
```bash
npm run build
# or
yarn build
```

## Deployment Options

### GitHub Pages

1. Add the homepage field to your `package.json`:
```json
"homepage": "https://yourusername.github.io/ahdb-slurry-wizard"
```

2. Install the GitHub Pages package:
```bash
npm install --save gh-pages
# or
yarn add gh-pages
```

3. Add deployment scripts to `package.json`:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build",
  ...
}
```

4. Deploy to GitHub Pages:
```bash
npm run deploy
# or
yarn deploy
```

### Netlify

1. Create a `netlify.toml` file in the root directory:
```toml
[build]
  command = "npm run build"
  publish = "build"
```

2. Deploy to Netlify using one of these methods:
   - Connect your GitHub repository to Netlify
   - Use the Netlify CLI: `netlify deploy --prod`
   - Drag and drop the `build` folder to Netlify's drag-and-drop interface

### Azure Static Web Apps

1. Create a new Static Web App in the Azure portal
2. Connect your GitHub repository to Azure
3. Configure the build settings:
   - Build command: `npm run build`
   - Output directory: `build`

## Features

- Calculates slurry storage requirements based on livestock numbers
- Estimates nitrogen loading and provides compliance recommendations
- Accounts for rainfall, yard areas, and roof water collection
- Generates monthly breakdowns of slurry production and storage capacity
- Visualizes storage capacity vs. slurry production

## Customization

### Adding or Modifying Livestock Types

To add or modify livestock reference data, edit the `src/data/referenceData.js` file. Add new entries to the `livestockReferenceData` object with the appropriate daily excreta and annual nitrogen values.

### Changing Rainfall Data

The application uses a simplified rainfall dataset for demonstration purposes. To use actual rainfall data for specific grid references, update the `rainfallData` object in `src/data/referenceData.js`.

## Accessibility

This application has been designed to meet WCAG 2.1 AA accessibility standards:
- Color contrast ratios meet AA standards
- All form elements have proper labels and ARIA attributes
- Keyboard navigation is fully supported
- Status indicators use both color and text for clear communication

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Agriculture and Horticulture Development Board (AHDB) for the original Excel-based Slurry Wizard tool
- React.js and Create React App for the development framework
