// 全局管理 renderers
const allRenderers = {};

export function setRenderer(viewMod, renderer) {
  allRenderers[viewMod] = renderer;
}

export function getRenderer(viewMod) {
  return allRenderers[viewMod];
}

export function removeRenderer(viewMod) {
  delete allRenderers[viewMod];
}
