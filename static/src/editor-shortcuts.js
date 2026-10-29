export function isVimToggleShortcut(event) {
  return event.key === 'F2' && Boolean(event.ctrlKey || event.metaKey)
    && Boolean(event.shiftKey) && !event.altKey && !event.repeat && !event.isComposing;
}
