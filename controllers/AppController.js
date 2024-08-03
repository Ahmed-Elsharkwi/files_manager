import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * getStatus - checks Redis and DB status
   * @reqeust: request sent by router
   * @response: JSON object with the feedback
   * returns: the JSON object along with 200 OK
   */
  static getStatus(request, response) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    response.status(200).send(status);
  }

  /**
   * getStats - checks the number of users and files in our db
   * @request: sent by router
   * @response: JSON object with the feedback
   * returns: the JSON object along with 200 OK
   */
  static async getStats(request, response) {
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    response.status(200).send(stats);
  }
}

export default AppController;
