// @flow
import * as React from 'react';

/* eslint-disable react/no-danger */

type Props = {
  config: {
    host: string,
    siteName: string,
  },
  children?: ?React.Node,
  style?: ?React.Node,
};

export default class BaseEmail extends React.Component<Props> {
  render() {
    const { config, style } = this.props;
    return (
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          {style ? <style dangerouslySetInnerHTML={{ __html: style }}></style> : null}
        </head>
        <body>
          <table><tbody><tr>
            <td style={{ paddingRight: '10px' }}><img src={`${config.host}/assets/email-logo.png`} alt="" /></td>
            <td><h1>{config.siteName}</h1></td>
          </tr></tbody></table>
          <hr />
          {this.props.children}
        </body>
      </html>
    );
  }
}
