import { isWebPSupported, resolveImagePrimaryUrl } from '@utils/image-asset.js'

async function resolvePreviewSource(source) {
  return {
    strategy: 'asset-array-choice',
    supportsWebP: isWebPSupported(),
    url: resolveImagePrimaryUrl(source)
  }
}

export function useWebP() {
  return {
    resolvePreviewSource
  }
}
