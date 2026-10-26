// Exact-source changes, with bounded line alignment. Large ambiguous rewrites
// become one broad change rather than consuming unbounded time or guessing.
function trimmedChange(before, from, to, insert) {
  let prefix = 0;
  while (from + prefix < to && prefix < insert.length && before[from + prefix] === insert[prefix]) prefix++;
  let suffix = 0;
  while (to - suffix > from + prefix && insert.length - suffix > prefix && before[to - suffix - 1] === insert[insert.length - suffix - 1]) suffix++;
  return { from: from + prefix, to: to - suffix, insert: insert.slice(prefix, insert.length - suffix) };
}

// Bounded Myers alignment keeps sparse edits small even in very long notes.
// Both the search and its backtracking storage share the same work limit.
function alignLines(a, b) {
  const frontier = new Map([[1, 0]]), trace = [];
  let work = 0;
  const at = (map, k) => map.get(k) ?? -Infinity;
  for (let d = 0; d <= a.length + b.length; d++) {
    trace.push(new Map(frontier));
    for (let k = -d; k <= d; k += 2) {
      if (++work > 250000) return null;
      let x = k === -d || (k !== d && at(frontier, k - 1) < at(frontier, k + 1)) ? at(frontier, k + 1) : at(frontier, k - 1) + 1;
      let y = x - k;
      while (x < a.length && y < b.length && a[x] === b[y]) {
        if (++work > 250000) return null;
        x++; y++;
      }
      frontier.set(k, x);
      if (x < a.length || y < b.length) continue;
      const operations = [];
      for (let level = d; level >= 0; level--) {
        const previous = trace[level], diagonal = x - y;
        const previousDiagonal = diagonal === -level || (diagonal !== level && at(previous, diagonal - 1) < at(previous, diagonal + 1)) ? diagonal + 1 : diagonal - 1;
        const previousX = previous.get(previousDiagonal) ?? 0, previousY = previousX - previousDiagonal;
        while (x > previousX && y > previousY) { operations.push('='); x--; y--; }
        if (level === 0) break;
        if (x === previousX) { operations.push('+'); y--; }
        else { operations.push('-'); x--; }
      }
      return operations.reverse();
    }
  }
}

export function sourceChanges(before, after) {
  if (before === after) return [];
  const lines = text => text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g).filter(Boolean);
  const a = lines(before), b = lines(after);
  let start = 0, endA = a.length, endB = b.length;
  while (start < endA && start < endB && a[start] === b[start]) start++;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
  const offsets = [0];
  for (const line of a) offsets.push(offsets.at(-1) + line.length);
  const operations = alignLines(a.slice(start, endA), b.slice(start, endB));
  if (!operations) return [trimmedChange(before, offsets[start], offsets[endA], b.slice(start, endB).join(''))];
  const changes = [];
  let i = start, j = start, step = 0;
  while (step < operations.length) {
    if (operations[step] === '=') { i++; j++; step++; continue; }
    const from = offsets[i];
    let insert = '';
    while (step < operations.length && operations[step] !== '=') {
      if (operations[step++] === '-') i++;
      else insert += b[j++];
    }
    changes.push(trimmedChange(before, from, offsets[i], insert));
  }
  return changes;
}

// A deletion/insertion inside repeated source can represent several equally
// valid alignments. Include every equivalent location in its conflict footprint
// instead of silently assigning the human's edit to a different identical line.
function conflictRange(base, change) {
  let from = change.from, to = change.to;
  if (!change.insert) {
    let leftEnd = to, rightStart = from;
    while (from > 0 && base[from - 1] === base[leftEnd - 1]) { from--; leftEnd--; }
    while (to < base.length && base[rightStart] === base[to]) { rightStart++; to++; }
  } else if (from === to) {
    const size = change.insert.length;
    let shifted = 0;
    while (from > 0 && base[from - 1] === change.insert[(size - 1 - shifted % size + size) % size]) { from--; shifted++; }
    shifted = 0;
    while (to < base.length && base[to] === change.insert[shifted % size]) { to++; shifted++; }
  }
  return { from, to };
}

export function mergeSources(base, local, external) {
  if (local === base || local === external) return external;
  if (external === base) return local;
  const ours = sourceChanges(base, local), theirs = sourceChanges(base, external);
  const combined = [...ours];
  for (const other of theirs) {
    let identical = false;
    for (const own of ours) {
      if (own.from === other.from && own.to === other.to && own.insert === other.insert) { identical = true; continue; }
      // Insertions on a replacement boundary are ambiguous. Distinct adjacent
      // replacements are safe, as are edits to separate sections.
      const a = conflictRange(base, own), b = conflictRange(base, other);
      const overlap = own.from === own.to || other.from === other.to
        ? a.from <= b.to && b.from <= a.to
        : a.from < b.to && b.from < a.to;
      if (overlap) return null;
    }
    if (!identical) combined.push(other);
  }
  combined.sort((a, b) => a.from - b.from);
  let result = '', offset = 0;
  for (const change of combined) {
    result += base.slice(offset, change.from) + change.insert;
    offset = change.to;
  }
  return result + base.slice(offset);
}
