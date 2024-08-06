import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';


function controllerRouting(app) {
  // App controller
  const router = express.Router();
  app.use('/', router);

  router.get('/status', (req, res) => {
    // returns true if redis and DB clients are up
    AppController.getStatus(req, res);
  });

  router.get('/stats', (req, res) => {
    // returns number of users and files in the DB
    AppController.getStats(req, res);
  });

  router.post('/users', (req, res) => {
    // Adds a new user
    UsersController.postNew(req, res);
  });

  router.get('/connect', (req, res) => {
    // Genrates token in redis for user
    AuthController.getConnect(req, res);
  });

  router.get('/disconnect', (req, res) => {
    // Removes token from redis for a certain user
    AuthController.getDisconnect(req, res);
  });

  router.get('/users/me', (req, res) => {
    // Using a token, returns user object
    UsersController.getMe(req, res);
  });

  router.post('/files', (req, res) => {
    // Create file in DB and disk
    FilesController.postUpload(req, res);
  });

  router.get('/files/:id', (req, res) => {
    // Gets file based on id
    FilesController.getShow(req, res);
  });

  router.get('/files', (req, res) => {
    // Retrieve all users file documents for a specific parentId and with pagination
    FilesController.getIndex(req, res);
  });

  router.put('/files/:id/publish', (req, res) => {
    // Sets isPublic to true on the file document based on the ID
    FilesController.putPublish(req, res);
  });

  router.put('/files/:id/unpublish', (req, res) => {
    // Sets isPublic to false on the file document based on the ID
    FilesController.putUnpublish(req, res);
  });

  router.get('/files/:id/data', (req, res) => {
    // Returns the content of the file document based on the ID
    FilesController.getFile(req, res);
  });
}
export default controllerRouting;
