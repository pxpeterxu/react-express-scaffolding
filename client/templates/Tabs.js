import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
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

const Tabs = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    tabs: React.PropTypes.oneOfType([
      React.PropTypes.object,
      React.PropTypes.array
    ]).isRequired,
    value: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.bool
    ]),
    onChange: React.PropTypes.func.isRequired,
    disabledTabs: React.PropTypes.oneOfType([
      React.PropTypes.array,
      React.PropTypes.object
    ]),
    className: React.PropTypes.string
  },

  onChange: function(tab, e) {
    e.preventDefault();
    this.props.onChange(tab);
  },

  doNothingCallback: function(e) {
    e.preventDefault();
    e.stopPropagation();
  },

  render: function() {
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
});

export default Tabs;
