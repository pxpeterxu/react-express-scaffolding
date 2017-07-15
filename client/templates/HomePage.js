import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';

const HomePage = React.createClass({
  mixins: [PureRenderMixin],

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

export default HomePage;
