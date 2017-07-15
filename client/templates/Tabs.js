import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

/**
 * Normalize an options array for a <select> to be the format
 * of an array of { value, label }
 * @param {Array|Object} options  options, either as
 *                                - Array of strings
 *                                - Array of { value, label }
 *                                - Object of { label: value }
 * @return Array of { value, label } for each option
 */
function normalizeOptions(options) {
  if (options instanceof Array) {
    if (options[0] && typeof options[0] !== 'object') {
      // Options is array of simple strings/numbers
      return options.map((opt) => {
        return { value: opt, label: opt };
      });
    }
  } else if (typeof options === 'object') {
    // Options is { value: label }
    return _.map(options, (label, value) => {
      return { value: value, label: label };
    });
  }

  return options;
}

class Tabs extends React.PureComponent {
  static propTypes = {
    tabs: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array
    ]).isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool
    ]),
    onChange: PropTypes.func.isRequired,
    disabledTabs: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object
    ]),
    className: PropTypes.string
  };

  onChange = (tab, e) => {
    e.preventDefault();
    this.props.onChange(tab);
  };

  doNothingCallback = (e) => {
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
        {tabs.map((option) => {
          const tab = option.value;
          const label = option.label;

          let tabClassName = null;
          let onClick = this.onChange.bindMemoized(this, tab);

          if (activeTab === tab) {
            tabClassName = 'active';
          } else if (disabledTabs && disabledTabs.indexOf(tab) !== -1) {
            tabClassName = 'disabled';
            onClick = this.doNothingCallback;
          }

          return (
            <li key={tab}
                className={tabClassName}
                data-tab={tab}>
              <a href={`#${label}`} onClick={onClick}>
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
