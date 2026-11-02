// Only application-owned codes and text may reach the visible fallback.
const messages=Object.freeze({
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
export const childStage=value=>['parse','render','sanitize','mount-size'].includes(value);
export const diagnosticCode=value=>typeof value==='string'&&Object.hasOwn(messages,value)?value:undefined;
export function diagnosticText(value){const code=diagnosticCode(value);return code?` Diagnostic ${code}: ${messages[code]}`:'';}
