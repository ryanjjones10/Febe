var React = require('react');
var Header = require('../components/shared/header');
var Footer = require('../components/shared/footer');
var Router = require('react-router');
var Link = Router.Link;

module.exports = React.createClass({
  render: function(){
    return (
      <div>
        <Header link='/' title='Browse'/>
        <div>Dashboard</div>
        <Link to="/devprofile"><button className="btn btn-primary">Dev Profile Temp</button></Link>
        <Link to="/orgprofile"><button className="btn btn-primary">Org Profile Temp</button></Link>
        <Footer />
      </div>
    )
  },
});