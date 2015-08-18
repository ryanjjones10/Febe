var _ = require('lodash');
var url_parse = require('url').parse;
var validator = require('validator');
var Project = require('../db').Project;
var express = require('express');
var router = express.Router();

var validate_id = function(req, res, next) {
  var project_id = Number(req.params.project_id);
  if (Number.isNaN(project_id)) return res.status(400).send();
  req.params.project_id = project_id;
  next();
};

router.get('/:project_id', validate_id, function(req, res) {
  Project.with_extras(req.params.project_id, true).then(function(project) {
    if (!project.published) {
      console.log('no pub')
      if (!req.isAuthenticated()) { 
      console.log('no auth')
        return res.status(403).send();
      }
      Project.user_has_access(project, req.user).then(function(has_access) {
        if (!has_access) 
      console.log('no access')
          return res.status(403).send();
        res.json(project);
      }, function() {
        return res.status(500).send();
      });
    } else {
      console.log("Project: ", res.json(project))
      res.json(project);
    }
  });
});

router.post('/', function(req, res) {
  if (!req.isAuthenticated() || req.user.kind !== 'rep') return res.status(403).send();

  var required_fields = [
    'organization_id', 'name', 'complete_by', 'description'
  ];

  if (!_.all(required_fields, function(field) {return field in req.body;})) return res.status(400).send();

  var organization_id = Number(req.body.organization_id);

  var links = [];
  if ('links' in req.body && Array.isArray(req.body.links) && req.body.links.length) {
    req.body.links.forEach(function(link) {
      if (validator.isURL(link, {'protocol': ['http', 'https']})) {
        var hostname = url_parse(link).hostname;
        var type = _.get({
          'facebook.com': 'facebook',
          'github.com': 'github',
          'linkedin.com': 'linkedin'
        }, hostname, 'other');

        links.push([type, link].join('|'));
      }
    });
  }

  Project.create({
    'name': req.body.name,
    'complete_by': req.body.complete_by,
    'description': req.body.description,
    'links': links
  }, organization_id, req.user.id).then(function(project) {
    res.json(project);
  });
});

router.put('/:project_id', validate_id, function(req, res){
  var project_id = Number(req.params.project_id);
  var projectData = req.body
  console.log("project data:", projectData)
  Project.update(product_id, projectData)
});

router.put('/:project_id/add_member/:user_id', validate_id, function(req, res) {
  var project_id = Number(req.params.project_id);
  var user_id = Number(req.params.user_id);
  if (Number.isNaN(user_id)) return res.status(400).send();

  if (!req.isAuthenticated) return res.status(403).send();

  Project.with_extras(project_id, {'owner': true}).then(function(project) {
    if (project.owner.id !== req.user.id) throw new Error('User doesn\'t have permission to add members');
    return Project.add_member(project_id, user_id).then(function() {
      res.status(201).send();
    });
  }, function(err) {
    res.status(400).send(err);
  });
});

module.exports = router;
