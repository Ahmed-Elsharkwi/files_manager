import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import {v4 as uuidv4} from 'uuid'

class AuthController {
  /**
   * getConnect - login the user
   * @reqeust: request sent by router
   * @response: JSON object with the feedback
   * returns: the JSON object along with 200 OK
  */
  static async getConnect(req, res) {
    const headers = req.headers;
    let userCollection = dbClient.db.collection('users');
    const name_token = 'authorization';

    let token = headers[name_token].split(" ");
    // eslint-disable-next-line
    let decodedToken = Buffer.from(token[1], 'base64').toString('utf-8');
    let user = decodedToken.split(":");
    let email = user[0];
    let password = sha1(user[1])
    let found_user = await userCollection.findOne({ email: email });

    if (!found_user || found_user.password != password ) {
      return res.status(401).send({"error":"Unauthorized"});
    }
    else {
      let session_id = uuidv4();
      let key = `auth_${session_id}`
      redisClient.set(key, found_user._id.toString(), 86400);
      return res.status(200).send({"token": session_id});
    }
  }
  /**
   * getDisconnect - logout the user
   * @reqeust: request sent by router
   * @response: JSON object with the feedback
   * returns: the JSON object along with 200 OK
  */
  static async getDisconnect(req, res) {
    const name_token = "x-token";
    const headers = req.headers;
    const token = headers[name_token];
    
    if (!await redisClient.get(`auth_${token}`)) {
      return res.status(401).send({"error":"Unauthorized"});
    }
    else {
      redisClient.del(`auth_${token}`);
      return res.status(200).send();
    }
  }
}

export default AuthController;
