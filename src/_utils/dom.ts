import { type DOMSource } from '@cycle/dom';

export function $el(dom: DOMSource, selector: string) {
  return dom.select(selector) as any;
}
