// This parser only recognizes the source boundary; YAML is never interpreted.
export const frontMatter = {
  defineNodes: [{ name: 'FrontMatter', block: true }],
  parseBlock: [{
    name: 'FrontMatter', before: 'HorizontalRule',
    parse(cx, line) {
      if (cx.lineStart !== 0 || line.text !== '---') return false;
      let end = line.text.length;
      while (cx.nextLine()) {
        end = cx.lineStart + line.text.length;
        if (line.text === '---' || line.text === '...') {
          cx.nextLine();
          break;
        }
      }
      cx.addElement(cx.elt('FrontMatter', 0, end));
      return true;
    },
  }],
};
