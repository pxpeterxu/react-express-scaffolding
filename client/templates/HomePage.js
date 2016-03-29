'use strict';

var React = require('react');

var HomePage = React.createClass({
  render: function() {
    return (<div>
      <div className="jumbotron">
        <div className="container">
          <h1>Hello world</h1>
          <p>Some text describing the product or website goes here.</p>
        </div>
      </div>
    </div>);
  }
});

module.exports = HomePage;
