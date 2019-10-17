import React from 'react';
import ReactDOM from 'react-dom';
import Timer from './timer';
import registerServiceWorker from './registerServiceWorker';

let savedName = localStorage.getItem('lastTimer');

ReactDOM.render(
  <Timer
    name={savedName}
    onTick={state => {
      document.title = `${state.name || 'Timer'} - ${state.display}`;
      if (state.name !== savedName) {
        if (!state.name) localStorage.removeItem('lastTimer');
        else localStorage.setItem('lastTimer', state.name);
      }
    }}
  />,
  document.getElementById('root')
);
registerServiceWorker();
