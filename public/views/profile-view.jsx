var React = require('react');
var Reflux = require('reflux');
var Actions = require('../actions');
var TransitionHook = require('react-router').TransitionHook;
//material ui
var mui = require('material-ui');
var ThemeManager = new mui.Styles.ThemeManager();
var Paper = mui.Paper;
var RaisedButton = mui.RaisedButton;
// shared components
var Footer = require('../components/shared/footer');
var ProfileHeader = require('../components/profile/profile-header');
var Projects = require('../components/profile/profile-projects');
var ProfileStore = require('../stores/profile-store');
var ProfileHeaderEdit = require('../components/profile/edit-components/profile-header-edit');
var ProfileMethods = require('../components/profile/sharedProfileMethods');
var Autocomplete =require('../components/shared/autocomplete');
var TimelineEntry = require('../components/dashboard/timelineEntry');
var TimelineStore = require('../stores/timeline-store');
var ImgurUpload = require('../utils/imgur');

var ProfileView = React.createClass({
  mixins: [
    Reflux.listenTo(ProfileStore, 'onChange'),
    Reflux.listenTo(TimelineStore, 'onLoad'),
    TransitionHook
  ],
  routerWillLeave: function(next) {
    if (next.location.pathname.indexOf('/profile') === -1) return;
    this.setState({userId: (next.params.id !== undefined) ? next.params.id : window.localStorage.getItem('userId')}, function() {
      this.componentWillMount();
    });
  },
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },
  getChildContext: function() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },
  isOwnProfile: function() {
    return (this.props.params.id === undefined || (window.localStorage.getItem('userId') !== undefined && this.props.params.id === window.localStorage.getItem('userId')));
  },
  getInitialState: function() {
    return {
      userId: (this.props.params.id !== undefined) ? this.props.params.id : window.localStorage.getItem('userId'),
      first_name: '',
      last_name: '',
      title: '',
      location: '',
      bio: null,
      links: [],
      strengths: [],
      interests: [],
      userData: {},
      editing: false,
      hasOrg: false,
      projects: [],
      organization: '',
      showTimeline: false,
      'timeline': [],
      avatar: ''
    };
  },
  componentWillMount: function() {
    Actions.getProfile(this.state.userId);
    if (this.isOwnProfile()) {
      Actions.getTimeline();
      this.setState({showTimeline: true});
    } else {
      this.setState({showTimeline: false});
    }
  },
  onLoad: function(event, timeline) {
    this.setState({'timeline': timeline});
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
      interests: userData.interests,
      organization: userData.organization,
      projects: userData.projects,
      avatar: userData.avatar
    });
  },

  edit_toggle: function() {
    this.setState({
      editing: !this.state.editing
    });
  },
  save: function() {
    var updateData = {
      title: this.state.title,
      location: this.state.location,
      bio: this.state.bio,
      links: this.state.links,
      avatar: this.state.avatar
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

  handleImage: function(event) {
    var that = this;
    ImgurUpload.uploadImage(event)
    .then(function(link) {
      that.setState({
        avatar: link
      });
    });
  },

  updateHeader: function(state) {
    this.setState(state);
  },

  updateLinks: function(link) {
    var links = this.state.links.slice();
    links.push(link);
    this.setState({
      links: link
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
        <div className="dev-fields">
          <div>
            {(function() {
              if (this.state.editing) {
                return (
                  <div className="col-md-8 col-md-offset-1">
                    <h3>Tech Strengths</h3>
                    <Autocomplete url='/tag/search?fragment=' className="col-md-8 col-md-offset-1" placeholder='Search for strengths' values={this.state.strengths} ref='strengths'/>
                  </div>
                )
              } else {
                return ( 
                  <div>
                    <h3>Tech Strengths</h3>
                    {this.strengthsList()}
                  </div>
                )
              }
            }.bind(this))()}
          </div>
          <div>
            {(function() {
              if (this.state.editing) {
                return (
                  <div className="col-md-8 col-md-offset-1">
                    <h3>Interests</h3>
                    <Autocomplete url='/tag/search?kind=cause&fragment=' placeholder='Search for causes' min_chars={0} values={this.state.interests} ref='interests'/>
                  </div>
                )
              } else {
                return (
                  <div> 
                    <h3>Interests</h3>
                    {this.interestsList()}
                  </div>
                )
              }
            }.bind(this))()}
          </div>
        </div>
      </div>
    );
  },
  setBio: function(){
    return this.state.bio ? this.state.bio : 'Tell us about yourself...just hit the edit button'
  },
  createOrgURL: function(){
    return '#/organization/' + this.state.organization.id;
  },
  repButtons: function(){
    if (this.state.kind !== 'rep' || !this.isOwnProfile()) return '';
    return (
      this.state.organization.id ? 
        <RaisedButton linkButton={true} href={this.createOrgURL()} secondary={true} label={this.state.organization.name}/> :
        <div>
          <span className="createorg-button">
            <RaisedButton linkButton={true} href="#/createorg" secondary={true} label="Create Organization"/>
          </span>
          <span>
            <RaisedButton linkButton={true} href="#/createorg" secondary={true} label="Join an Organization"/>
          </span>
        </div>
    )
  },

  showTimeline: function() {
    if (!this.state.showTimeline) return '';

    return (
      <div className="timeline-container">
        <h3>Timeline</h3>
        <div className="each-card">
          {this.state.timeline.map(function(entry) {
            return <TimelineEntry key={entry.entry.id} entry={entry}/>;
          }.bind(this))}
        </div>
      </div>
    );
  },

  profile: function() {
    if (this.state.editing) {
      return (
        <div className="container profileMargin">
        <Paper zDepth={1}>
          <div className="row">
            <div className="col-md-8 col-md-offset-1 profileBox">
              <ProfileHeaderEdit
                  save={this.save}
                  updateHeader={this.updateHeader}
                  updateLinks={this.updateLinks}
                  first_name={this.state.first_name}
                  last_name={this.state.last_name}
                  avatar={this.state.avatar}
                  title={this.state.title}
                  location={this.state.location}
                  links={this.state.links}
                  handleImage={this.handleImage} />
            </div>
          </div>
          {this.devFields()}
          <div className="row">
            <div className="col-md-8 col-md-offset-1">
              <div className="bio">
                <h3>Bio</h3>
                <textarea
                  value={this.state.bio}
                  onChange={this.updateBio}
                  placeholder="Tell us about yourself..."
                  className="form-control"
                  rows="4"
                  cols="195"
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
        <div className="profileMargin">
          <Paper style={{'maxWidth': '100%'}} zDepth={1}>
            <div className="all-of-them">
              <div className="profile-info">
                <div className="profileBox">
                  <ProfileHeader
                      edit_toggle={this.edit_toggle}
                      show_edit_button={this.isOwnProfile()}
                      first_name={this.state.first_name}
                      last_name={this.state.last_name}
                      avatar={this.state.avatar}
                      title={this.state.title}
                      location={this.state.location}
                      links={this.state.links} />
                </div>
                <div className="rest-of-profile">
                {this.devFields()}
                </div>
                <div className="rest-of-profile">
                  <div className="">
                    <div>
                      {this.repButtons()}
                    </div>
                    <div>
                      <h3>Bio</h3>
                      <div>{this.setBio()}</div>
                    </div>
                  </div>
                </div>
                <div className="projects-in-profile">
                  <Projects projects={this.state.projects} />
                </div>  
              </div>  
              {this.showTimeline()}
            </div>
          </Paper>
        </div>
      );
    }
  },
  render: function() {
    return (
      <div>
        {this.profile()}
        <Footer />
      </div>
    );
  }
});

module.exports = ProfileView;
