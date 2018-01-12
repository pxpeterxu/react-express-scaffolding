// @flow
import type { Node } from 'react';

export type Response = {
  success: boolean,
  messages: Array<string>,
  errTypes: Array<string>,
};

export type OptionValue = string | number | boolean | null;
export type Options = Array<{value: OptionValue, label: Node} | string> | {[string]: Node};
