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

class Header extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
    };
  }

  render () {
    return (
      <div>
        <nav className="navbar navbar-default navbar-fixed-top lower-nav base-color2 no-border shadowed" role="navigation">
          <div className="container wide-container">
            <div className="navbar-header">
              <p id="application-name" className="navbar-brand">Predict clients’ interests in terms of product line</p>
            </div>
            <div className="navbar-collapse collapse" id="navbar-main">
              <ul className="nav navbar-nav">
                <li>
                  <a className="button-color nav-text" href="/">Application</a>
                </li>
                <li>
                  <a className="button-color nav-text" href="overview.html">Overview</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <nav className="navbar navbar-default navbar-fixed-top small-nav base-color no-border shadowed" role="navigation">
          <div className="container wide-container">
            <div className="navbar-collapse collapse small-nav" id="navbar-main">
              <ul className="nav navbar-nav small-nav">
                <li>
                  <a href="https://new-console.ng.bluemix.net/" className="h5 button-color" target="_blank">
                    <img src="images/bluemix_icon.png" className="inline-icon" />
                    IBM Bluemix
                  </a>
                </li>
                <li>
                  <a href="https://console.ng.bluemix.net/catalog/services/ibm-watson-machine-learning/" className="h5 button-color" target="_blank">
                    <img src="images/ml_icon_green.png" className="inline-icon" />
                    Watson Machine Learning
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

module.exports = Header;
