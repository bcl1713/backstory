// Only application-owned codes and text may reach the visible fallback.
const sanitizerMessages=Object.freeze({
  'sanitize-limit':'Diagram output exceeded a sanitizer bound.',
  'sanitize-xml':'Diagram output did not pass SVG XML checks.',
  'sanitize-id':'Diagram output contained an invalid or duplicate identifier.',
  'sanitize-node':'Diagram output contained an unsupported XML node type.',
  'sanitize-namespace':'Diagram output contained an unsupported element namespace.',
  'sanitize-element-filter':'Diagram output contained an unsupported filter element.',
  'sanitize-element-resource':'Diagram output contained an unsupported resource or active element.',
  'sanitize-element':'Diagram output contained another unsupported element.',
  'sanitize-attribute-namespace':'Diagram output contained an unsupported attribute namespace.',
  'sanitize-scalar':'Diagram output contained an invalid scalar geometry value.',
  'sanitize-viewbox':'Diagram output contained an invalid viewBox attribute.',
  'sanitize-numeric-list':'Diagram output contained an invalid numeric list attribute.',
  'sanitize-points':'Diagram output contained invalid polygon or polyline points.',
  'sanitize-path':'Diagram output contained invalid path geometry.',
  'sanitize-transform':'Diagram output contained an invalid transform.',
  'sanitize-reference':'Diagram output contained an invalid local marker or clipping reference.',
  'sanitize-paint':'Diagram output contained an unsupported paint value.',
  'sanitize-text-attribute':'Diagram output contained an unsupported text attribute value.',
  'sanitize-metadata':'Diagram output contained invalid class or accessibility metadata.',
  'sanitize-attribute':'Diagram output contained another unsupported attribute or value.',
  'sanitize-viewport':'Diagram output did not provide a valid positive viewport.',
});
const messages=Object.freeze({
  ...sanitizerMessages,
  setup:'The renderer frame could not be started.',
  load:'The renderer frame did not finish loading in time.',
  hello:'The loaded frame did not announce its renderer in time.',
  ready:'The renderer channel did not become ready in time.',
  queue:'The renderer did not leave the worker queue in time.',
  result:'The renderer did not return a result in time.',
  frame:'The renderer frame reported a load error.',
  reload:'The renderer frame loaded more than once.',
  protocol:'The renderer response did not pass protocol checks.',
  child:'The renderer reported a failure without stage details.',
  parse:'The renderer could not validate the diagram input.',
  render:'The renderer failed while generating diagram output.',
  sanitize:'The renderer failed while validating diagram output.',
  'mount-size':'The renderer failed while displaying or measuring diagram output.',
});
export const childStage=value=>['parse','render','sanitize','mount-size'].includes(value)||(typeof value==='string'&&Object.hasOwn(sanitizerMessages,value));
export const diagnosticCode=value=>typeof value==='string'&&Object.hasOwn(messages,value)?value:undefined;
export function diagnosticText(value){const code=diagnosticCode(value);return code?` Diagnostic ${code}: ${messages[code]}`:'';}
