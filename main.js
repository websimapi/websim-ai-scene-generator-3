import { sceneState, addAssetToScene, getAssetById, updateAsset, removeAsset } from './state.js';
import { initializeCanvas, redrawCanvas, getAssetAtPos, getSelectedAsset } from './editor.js';
import { generateImage } from './api.js';

const loadingOverlay = document.getElementById('loading-overlay');
const generateSceneBtn = document.getElementById('generate-scene-btn');
const generateAssetBtn = document.getElementById('generate-asset-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const assetLibrary = document.getElementById('asset-library');
const propertiesPanel = document.getElementById('properties-panel-content');

let lastGeneratedAsset = null;

function showLoader() {
    loadingOverlay.style.display = 'flex';
}

function hideLoader() {
    loadingOverlay.style.display = 'none';
}

async function handleGenerateScene() {
    showLoader();
    const prompt = document.getElementById('scene-prompt').value;
    try {
        const result = await generateImage(prompt, false, "16:9");
        sceneState.background = result.url;
        redrawCanvas();
    } catch (error) {
        console.error('Failed to generate scene:', error);
        alert('Could not generate scene background.');
    } finally {
        hideLoader();
    }
}

async function handleGenerateAsset() {
    showLoader();
    const prompt = document.getElementById('asset-prompt').value;
    if (!prompt) {
        alert('Please enter a prompt for the asset.');
        hideLoader();
        return;
    }
    try {
        const isTransparent = document.getElementById('asset-transparent').checked;
        const result = await generateImage(prompt, isTransparent, "1:1");
        const assetType = document.getElementById('asset-type').value;
        
        const asset = {
            id: `asset_${Date.now()}`,
            type: assetType,
            prompt: prompt,
            url: result.url,
            name: `${assetType} - ${prompt.substring(0, 15)}...`
        };
        
        lastGeneratedAsset = asset;
        
        const img = document.createElement('img');
        img.src = asset.url;
        img.title = asset.prompt;
        img.classList.add('library-asset');
        img.draggable = true; // Make library assets draggable
        img.dataset.assetId = asset.id;
        img.dataset.assetUrl = asset.url;
        img.dataset.assetType = asset.type;
        img.dataset.assetPrompt = asset.prompt;
        
        // Add to library
        assetLibrary.appendChild(img);
        
        // Select it
        selectLibraryAsset(img);

    } catch (error) {
        console.error('Failed to generate asset:', error);
        alert('Could not generate asset.');
    } finally {
        hideLoader();
    }
}

function selectLibraryAsset(element) {
    document.querySelectorAll('.library-asset').forEach(el => el.classList.remove('selected'));
    if(element) {
        element.classList.add('selected');
        lastGeneratedAsset = {
            id: `asset_${Date.now()}`,
            url: element.dataset.assetUrl,
            type: element.dataset.assetType,
            prompt: element.dataset.assetPrompt
        };
    } else {
        lastGeneratedAsset = null;
    }
}

function handleExportJson() {
    const dataStr = JSON.stringify(sceneState, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'scene.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

export function updatePropertiesPanel(assetId) {
    if (!assetId) {
        propertiesPanel.innerHTML = '<p>Select an asset to see its properties.</p>';
        return;
    }

    const asset = getAssetById(assetId);
    if (!asset) {
        propertiesPanel.innerHTML = '<p>Asset not found.</p>';
        return;
    }

    propertiesPanel.innerHTML = `
        <div class="control-group">
            <label>Name</label>
            <input type="text" id="prop-name" value="${asset.name}">
            <label>Type</label>
            <input type="text" id="prop-type" value="${asset.type}" disabled>
            <label>Prompt</label>
            <textarea id="prop-prompt" rows="3" disabled>${asset.prompt}</textarea>
            <label>X</label>
            <input type="number" id="prop-x" value="${Math.round(asset.x)}">
            <label>Y</label>
            <input type="number" id="prop-y" value="${Math.round(asset.y)}">
            <label>Width</label>
            <input type="number" id="prop-width" value="${Math.round(asset.width)}">
            <label>Height</label>
            <input type="number" id="prop-height" value="${Math.round(asset.height)}">
        </div>
    `;

    document.getElementById('prop-name').addEventListener('change', (e) => updateAsset(assetId, { name: e.target.value }));
    document.getElementById('prop-x').addEventListener('change', (e) => {
        updateAsset(assetId, { x: parseInt(e.target.value) });
        redrawCanvas();
    });
     document.getElementById('prop-y').addEventListener('change', (e) => {
        updateAsset(assetId, { y: parseInt(e.target.value) });
        redrawCanvas();
    });
     document.getElementById('prop-width').addEventListener('change', (e) => {
        updateAsset(assetId, { width: parseInt(e.target.value) });
        redrawCanvas();
    });
     document.getElementById('prop-height').addEventListener('change', (e) => {
        updateAsset(assetId, { height: parseInt(e.target.value) });
        redrawCanvas();
    });
}


document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas(document.getElementById('editor-canvas'));

    generateSceneBtn.addEventListener('click', handleGenerateScene);
    generateAssetBtn.addEventListener('click', handleGenerateAsset);
    exportJsonBtn.addEventListener('click', handleExportJson);

    assetLibrary.addEventListener('click', (e) => {
        if (e.target.classList.contains('library-asset')) {
            selectLibraryAsset(e.target);
        }
    });

    assetLibrary.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('library-asset')) {
            const assetData = {
                url: e.target.dataset.assetUrl,
                type: e.target.dataset.assetType,
                prompt: e.target.dataset.assetPrompt
            };
            e.dataTransfer.setData('application/json', JSON.stringify(assetData));
            selectLibraryAsset(e.target); // Also select it visually
        }
    });
});

export { lastGeneratedAsset };