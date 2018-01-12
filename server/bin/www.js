#!/usr/bin/env node
import 'source-map-support/register';
import app from '../app';

app.set('port', process.env.PORT || 31987);

const server = app.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + server.address().port);
});
