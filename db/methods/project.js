var _ = require('lodash');
var Promise = require('bluebird');
var db = require('../db');

var common = require('./common');

var Project = require('../models/project');
var User = require('../models/user');
var Organization = require('../models/organization');
var Tag = require('../models/tag');

var TimelineEntry = require('../models/timelineentry');

/**
 * Create and save a new Project
 * @param  {Object}                fields        Fields to create Project with
 * @param  {Integer|Organization}  organization  Organization or id
 * @param  {Integer|User}          owner         User or id of the Project owner
 * @return {Promise.<Project>}                   The newly created Project
 */
var create = function(fields, organization, owner) {
  if (organization === undefined) return Promise.reject(new Error('Organization not given.'));
  if (owner === undefined) return Promise.reject(new Error('Owner not given.'));

  return Project.save(fields).then(function(project) {
    return Promise.all([
      db.relate(organization, 'owns', project),
      db.relate(owner, 'owns', project)
    ]).then(function() {
      TimelineEntry.create('create', organization, 'created project', project);
      return project;
    });
  });
};

/**
 * Update a Project
 * @param  {Integer} [id]     Id of the Project to update, can be omitted if there is an id key in fields
 * @param  {Object} fields    Fields to update
 * @return {Promise.<Project>}
 */
var update = function(id, fields) {
  if (typeof id === 'object') {
    fields = id;
    id = fields.id;
  }

  return Project.read(id).then(function(project) {
    return Project.save(_.extend(project, fields, {'id': id}));
  });
};

/**
 * Removes fields that shouldn't be public
 * @param {Project}
 * @return {Project} Project with private fields removed
 */
var clean = common.clean_generator(Project);

/**
 * Adds a User as a member of Project
 * @param {Integer|Project}  project   Project object or id to add User to
 * @param {Integer|User}     member    User or id to add to Project
 */
var add_member = common.add_rel_generator('User', 'member_of', 'Project');

/**
 * Adds an array of Users as members of Project
 * @param {Integer|Project}      project  Project or id to add Users to
 * @param {Integer[]|User[]}  members  Array of Users or ids to add to Project
 */
var add_members = common.add_rels_generator(add_member);

/**
 * Adds Tag as a skill of Project
 * @param {Integer|Project}  project  Project or id
 * @param {Integer|Tag}      skill    Tag or id
 */
var add_skill = common.add_rel_generator('Project', 'skill', 'Tag', true);

/**
 * Adds an array of Tags as skills of Project
 * @param {Integer|Project}  Project  Project or id
 * @param {Integer[]|Tag[]}  skills   Array of Tags or ids
 */
var add_skills = common.add_rels_generator(add_skill);

/**
 * Fetches one Project including specifed extras
 * @param  {Integer|Project}  [project]       Project or id
 * @param  {Object|Boolean}   [options=true]  Either an object with with the extras to include or true to include all extras
 * @return {Promise.<Project>}                Project with all specified models included
 */
var with_extras = function(project, options) {
  var project_id = (project == null) ? null : (project.id || project);
  var query = [
    'MATCH (node:Project)',
    (project_id !== null) ? 'WHERE id(node)={id}' : ''
  ].join(' ');

  if (options === undefined || options === true) options = {'include': true};

  var include = {};
  if (options.include === true || options.members) include.members = {'model': User, 'rel': 'member_of', 'direction': 'in', 'many': true};
  if (options.include === true || options.owner) include.owner = {'model': User, 'rel': 'owns', 'direction': 'in', 'many': false};
  if (options.include === true || options.organization) include.organization = {'model': Organization, 'rel': 'owns', 'direction': 'in', 'many': false};
  if (options.include === true || options.skills) include.skills = {'model': Tag, 'rel': 'skill', 'direction': 'out', 'many': true};

  var query_options = {
    'include': include,
    'limit': _.get(options, 'limit', 10),
    'skip': _.get(options, 'skip',  0)
  };

  return Project.query(query, {'id': project_id}, query_options).then(function(projects) {
    var cleaned_projects = [];

    projects.forEach(function(project) {
      var cleaned_project = clean(project);

      if (project.members) cleaned_project.members = project.members.map(User.clean);
      if (project.owner) cleaned_project.owner = User.clean(project.owner);
      if (project.organization) cleaned_project.organization = Organization.clean(project.organization);
      if (project.skills) cleaned_project.skills = project.skills.map(Tag.clean);

      cleaned_projects.push(cleaned_project);
    });

    return (project_id === null) ? projects : projects[0];
  });
};

 /**
 * Find Projects with relationships to all specified Tags
 * @param  {Integer[]}  tag_ids  Array of Tag ids
 * @param  {Object}     options
 * @return {Promise.<Project[]>}
 */
var find_by_tags = function(tag_ids, options) {
  var only_published = _.get(options, 'only_published', true);
  var order_by = _.get(options, 'order_by', undefined);
  var query = [
    'MATCH (tags:Tag) WHERE id(tags) IN {tags}',
    'WITH COLLECT(tags) AS t',
    'MATCH (project:Project)-->(tags) WHERE ALL(tag IN t WHERE (project)-[:skill]->(tag) OR (project)<-[:owns]-(:Organization)-[:cause]->(tag))',
    (only_published) ? 'AND project.published=true' : '',
    'RETURN DISTINCT project',
    (order_by) ? 'ORDER BY ' + order_by : ''
  ].join(' ');

  return db.query(query, {'tags': tag_ids}).then(function(projects) {
    if (!projects.length) return [];

    var calls = [];

    projects.forEach(function(project) {
      calls.push(with_extras(project, true));
    });

    return Promise.all(calls);
  });
};

/**
 * Check if a User is an owner/member of a Project
 * @param  {Integer|Project}  project
 * @param  {Integer|User}     user
 * @return {Promise.<Boolean>}
 */
var user_has_access = function(project, user) {
  var project_id = (project.id || project);
  var user_id = (user.id || user);
  var query = [
    'MATCH (u:User) WHERE id(u)={user_id}',
    'MATCH (p:Project) WHERE id(p)={project_id}',
    'RETURN (u)-[:owns|:member_of]->(p) IS NOT NULL AS has_access'
  ].join(' ');

  return db.query(query, {'user_id': user_id, 'project_id': project_id}).then(function(row) {
    return row.has_access;
  });
};

module.exports = {
  'create': create,
  'update': update,
  'clean': clean,
  'add_member': add_member,
  'add_members': add_members,
  'add_skill': add_skill,
  'add_skills': add_skills,
  'with_extras': with_extras,
  'find_by_tags': find_by_tags,
  'user_has_access': user_has_access
};
