var React = require('react');
var Router = require('react-router');
var Modal = require('./signinModal');
//renderable component
var Link = Router.Link;

module.exports = React.createClass({
  render: function(){
    return (
      <div className="header">
        <nav className="navbar navbar-default">
          <div className= "container-fluid">
            <Link to={this.props.link} className="navbar-brand">{this.props.title}</Link>
            <Link to={this.props.link2} className="navbar-brand">{this.props.title2}</Link>
            <Link to={this.props.link3} className="navbar-brand">{this.props.title3}</Link>
            <ul className="nav navbar-nav navbar-right">
              <div id="login">
              <Modal />
              </div>
            </ul>
          </div>
        </nav>
      </div>
    )
  },
})