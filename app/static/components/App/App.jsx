/* eslint-env es6

   Copyright 2016 IBM Corp.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import React from 'react';
import ReactDOM from 'react-dom';
import Header from '../Header'

class App extends React.Component {
  render () {
    return (
      <div>
        <div id="loader"></div>
        <Header />
        <div className="container wide-container">
          <div className="small-nav"></div>
          <div className="page-header"></div>
          <div className="bs-component">
            <fieldset className="well base-color2 special-border wide-container">
              {this.props.children}
            </fieldset>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = App;
