export const sceneState = {
    background: null,
    assets: [], // { id, type, prompt, url, x, y, width, height, name }
};

export function addAssetToScene(assetData) {
    sceneState.assets.push(assetData);
}

export function getAssetById(id) {
    return sceneState.assets.find(a => a.id === id);
}

export function updateAsset(id, updates) {
    const asset = getAssetById(id);
    if (asset) {
        Object.assign(asset, updates);
    }
}

export function removeAsset(id) {
    sceneState.assets = sceneState.assets.filter(a => a.id !== id);
}

