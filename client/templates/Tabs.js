'use strict';

var React = require('react');

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
      return options.map(function(opt) {
        return { value: opt, label: opt };
      });
    }
  } else if (typeof options === 'object') {
    // Options is { value: label }
    return _.map(options, function(label, value) {
      return { value: value, label: label };
    });
  }

  return options;
}

var Tabs = React.createClass({
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
    var tabs = normalizeOptions(this.props.tabs);
    var activeTab = this.props.value;
    var className = this.props.className || 'nav nav-tabs';
    var disabledTabs = this.props.disabledTabs;

    return (
      <ul className={className} role="navigation">
        {tabs.map(function renderTab(option) {
          var tab = option.value;
          var label = option.label;

          var tabClassName = null;
          var onClick = this.onChange.bindMemoized(this, tab);

          if (activeTab === tab) {
            tabClassName = 'active';
          } else if (disabledTabs && disabledTabs.indexOf(tab) !== -1) {
            tabClassName = 'disabled';
            onClick = this.doNothingCallback;
          }

          return (
            <li key={tab} className={tabClassName}
                data-tab={tab}>
              <a href="#" onClick={onClick}>
                {label}
              </a>
            </li>
          );
        }.bind(this))}
      </ul>
    );
  }
});

module.exports = Tabs;
