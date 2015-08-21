var React = require('react');
var Reflux = require('reflux');
var mui = require('material-ui');
var ThemeManager = new mui.Styles.ThemeManager();
var LeftNav = mui.LeftNav;
var MenuItem = mui.MenuItem;
var Paper = mui.Paper;
var Header = require('../components/shared/header');
var Footer = require('../components/shared/footer');
var ProfileHeader = require('../components/profile/profile-header');
var Projects = require('../components/profile/profile-projects');
var ProfileStore = require('../stores/profile-store');
var Actions = require('../actions');
var ProfileHeaderEdit = require('../components/profile/edit-components/profile-header-edit');
var ProfileMethods = require('../components/profile/sharedProfileMethods');
var Autocomplete =require('../components/shared/autocomplete');

var ProfileView = React.createClass({
  mixins: [
    Reflux.listenTo(ProfileStore, 'onChange')
  ],
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },
  getChildContext: function() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },
  getInitialState: function() {
    return {
      first_name: '',
      last_name: '',
      title: '',
      location: '',
      bio: '',
      links: [],
      strengths: [],
      interests: [],
      userData: {},
      editting: false,
      hasOrg: false
    };
  },
  componentWillMount: function() {
    return Actions.getProfile(window.localStorage.getItem('userId'));
  },
  onChange: function(event, userData) {
    this.setState({
      kind: userData.kind,
      first_name: userData.first_name,
      last_name: userData.last_name,
      title: userData.title,
      location: userData.location,
      bio: userData.bio,
      links: userData.links,
      strengths: userData.strengths,
      interests: userData.interests
    });
  },

  edit_toggle: function() {
    this.setState({
      editting: !this.state.editting
    });
  },

  save: function() {
    var updateData = {
      title: this.state.title,
      location: this.state.location,
      bio: this.state.bio
    };
    if (this.state.kind === 'dev') {
      updateData.strengths = Object.keys(this.refs.strengths.get_selections());
      updateData.interests = Object.keys(this.refs.interests.get_selections());
      this.setState({
        'strengths': this.refs.strengths.get_selections_array(),
        'interests': this.refs.interests.get_selections_array()
      });
    }
    this.edit_toggle();
    ProfileMethods.updateProfile('/user', updateData);
  },

  updateHeader: function(state) {
    this.setState(state);
  },

  updateLinks: function(link) {
    var links = this.state.links.slice();
    links.push(link);
    this.setState({
      links: links
    });
  },

  updateBio: function(event) {
    this.setState({'bio': event.target.value});
  },

  strengthsList: function() {
    return this.state.strengths.map(function(strength) {
      return <h4 key={strength.id} className="label-inline"> <span className="label label-color">{strength.name}</span> </h4>;
    });
  },

  interestsList: function() {
    return this.state.interests.map(function(interest) {
      return <h4 key={interest.id} className="label-inline"> <span className="label label-color">{interest.name}</span> </h4>;
    });
  },

  devFields: function() {
    if (this.state.kind !== 'dev') return '';
    return (
      <div className="row">
        <div className="col-md-8 col-md-offset-1">
          <div>
            <h3>Tech Strengths</h3>
            {(function() {
              if (this.state.editting) {
                return <Autocomplete url='/tag/search?fragment=' placeholder='Search for strengths' values={this.state.strengths} ref='strengths'/>;
              } else {
                return this.strengthsList();
              }
            }.bind(this))()}
          </div>
          <div>
            <h3>Interests</h3>
            {(function() {
              if (this.state.editting) {
                return <Autocomplete url='/tag/search?kind=cause&fragment=' placeholder='Search for causes' min_chars={0} values={this.state.interests} ref='interests'/>;
              } else {
                return this.interestsList();
              }
            }.bind(this))()}
          </div>
        </div>
      </div>
    );
  },

  profile: function() {
    if (this.state.editting) {
      return (
        <div className="container profileMargin">
        <Paper zDepth={4}>
          <div className="row">
            <div className="col-md-8 col-md-offset-1 profileBox">
              <ProfileHeaderEdit
                  save={this.save}
                  onChange={this.updateHeader}
                  first_name={this.state.first_name}
                  last_name={this.state.last_name}
                  avatar={this.state.userData.avatar}
                  title={this.state.title}
                  location={this.state.location}
                  links={this.state.links} />
            </div>
          </div>
          {this.devFields()}
          <div className="row">
            <div className="col-md-8 col-md-offset-1">
              <div>
                <h3>Bio</h3>
                <textarea
                  value={this.state.bio}
                  onChange={this.updateBio}
                  placeholder="Tell us about yourself..."
                  className="form-control bio"
                  rows="4"
                  cols="200"
                  style={{'marginBottom': '20px'}}
                  ></textarea>
              </div>
            </div>
          </div>
        </Paper>
        </div>
      );
    } else {
      return (
        <div className="container profileMargin">
        <Paper zDepth={4}>
          <div className="row">
            <div className="col-md-8 col-md-offset-1 profileBox">
              <ProfileHeader
                  edit_toggle={this.edit_toggle}
                  first_name={this.state.first_name}
                  last_name={this.state.last_name}
                  avatar={this.state.userData.avatar}
                  title={this.state.title}
                  location={this.state.location}
                  links={this.state.links} />
            </div>
            {this.devFields()}
            <div className="row">
              <div className="col-md-8 col-md-offset-1">
                <div>
                  <h3>Bio</h3>
                  {this.state.bio}
                </div>
                <Projects />
              </div>
            </div>
          </div>
        </Paper>
        </div>
      );
    }
  },
  generateMenu: [
    { type: MenuItem.Types.LINK, payload: '/', text: 'Home'},
    { type: MenuItem.Types.LINK, payload: '#/dashboard', text: 'Dashboard'},
    { type: MenuItem.Types.LINK, payload: '#/browse', text: 'Browse'},
    { type: MenuItem.Types.LINK, payload: '#/profile', text: 'My Profile'},
    { type: MenuItem.Types.SUBHEADER, text: 'Resources' },
    { route: '/', text: 'About'},
    { route: '/', text: 'Team'},
    { type: MenuItem.Types.LINK, payload: 'https://github.com/BracyBunch/Febe', text: 'GitHub' }
  ],
  render: function() {
    return (
      <div>
        <Header color={{'backgroundColor': '#6E7FD5'}} generateMenu = {this.generateMenu} />
        {this.profile()}
        <Footer />
      </div>
    );
  }
});

module.exports = ProfileView;