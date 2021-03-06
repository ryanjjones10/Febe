var React = require('react');
var ReactRouter = require('react-router');
//object that tells the router how we will keep track of where the user is
var HashHistory = require('react-router/lib/HashHistory').default;
//what to show on the page at any given time
var Router = ReactRouter.Router;
//object used to configure the router
var Route = ReactRouter.Route;
var Main = require('./components/main');
var Signup = require('./views/signupView');
var Termsofuse = require('./components/shared/termsOfUse');
var Privacypolicy = require('./components/shared/privacyPolicy');
var Profile = require('./views/profile-view');
var CreateProject = require('./views/create-project-view');
var Createorg = require('./views/create-org-view');
var Joinorg = require('./views/join-org-view');
var Organization = require('./views/org-view');
var Project = require('./views/project-view');
var Browse = require('./views/browse-view');

module.exports = (
  <Router history={new HashHistory}>
    <Route path="/" component={Main}>
      <Route name="signupdev" path="/signupdev" component={Signup} kind="dev" />
      <Route name="signupnp" path="/signupnp" component={Signup} kind="rep" />
      <Route name="termsofuse" path="/termsofuse" component={Termsofuse} />
      <Route name="privacypolicy" path="/privacypolicy" component={Privacypolicy} />
      <Route name="profile" path="/profile" component={Profile} />
      <Route name="profile" path="/profile/:id" component={Profile} />
      <Route name="createproject" path="/createproject" component={CreateProject} />
      <Route name="createorg" path="/createorg" component={Createorg} />
      <Route name="joinorg" path="/joinorg" component={Joinorg} />
      <Route name="project" path="/project/:id" component={Project} />
      <Route name="organization" path="/organization/:id" component={Organization} />
      <Route name="browse" path="/browse" component={Browse} />
    </Route>
  </Router>
);
