// @flow
import * as React from 'react';
import _ from 'lodash';
import { callProp } from 'react-updaters';
import type { Options, OptionValue } from '../../common/Types';

/**
 * Normalize an options array for a <select> to be the format
 * of an array of { value, label }
 * @param {Array|Object} options  options, either as
 *                                - Array of strings
 *                                - Array of { value, label }
 *                                - Object of { label: value }
 * @return Array of { value, label } for each option
 */
function normalizeOptions(options: Options): Array<{ value: OptionValue, label: React.Node }> {
  if (options instanceof Array) {
    return options.map((option) => {
      if (typeof option === 'string') {
        return { value: option, label: option };
      } else {
        return option;
      }
    });
  } else if (typeof options === 'object') {
    // Options is { value: label }
    return _.map(options, (label, value) => {
      return { value: value, label: label };
    });
  }
  return [];
}

type Props = {
  tabs: Options,
  value: OptionValue,
  onChange: (OptionValue) => mixed,
  disabledTabs?: ?Array<mixed>,
  className?: ?string,
};

class Tabs extends React.PureComponent<Props> {
  onChange = (tab: OptionValue, e: Event) => {
    e.preventDefault();
    this.props.onChange(tab);
  };

  doNothingCallback = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  render() {
    const tabs = normalizeOptions(this.props.tabs);
    const activeTab = this.props.value;
    const className = this.props.className || 'nav nav-tabs';
    const disabledTabs = this.props.disabledTabs;

    return (
      <ul className={className} role="navigation">
        {tabs.map((option, index) => {
          const tab = option.value;
          const label = option.label;

          const isDisabled = disabledTabs && disabledTabs.indexOf(tab) !== -1;

          let tabClassName = null;
          if (activeTab === tab) {
            tabClassName = 'active';
          } else if (isDisabled) {
            tabClassName = 'disabled';
          }

          return (
            <li key={JSON.stringify(tab)}
                className={tabClassName}
                data-tab={tab}>
              <a href={`#tab${index}`}>
                  onClick={isDisabled ? null : callProp(this, 'onChange', tab, true)}>
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }
}

export default Tabs;
