import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';



class UsersController {
  /**
   * postNew - creates a new user record in the users collection
   * @reqeust: request sent by router
   * @response: JSON object with the feedback
   * returns: the JSON object along with 201 created
   */
  static async postNew(request, response) {
    const password = request.body.password;
    const email = request.body.email;
    const userCollection = dbClient.db.collection('users');

    if (!email) {
      return response.status(400).send({"error":"Missing email"});
    }
    if (!password) {
      return response.status(400).send({"error":"Missing password"});
    }

    const user = await userCollection.findOne({ email: email });
    if (user) {
      return response.status(400).send({"error":"Already exist"});
    }
    
    const hashedPassword = sha1(password);

    try {
      
      const newUser = await userCollection.insertOne({
        email: email,
	password: hashedPassword,
      });

      const createdUser = {
        id: newUser.insertedId,
        email,
      }

      return response.status(201).send(createdUser);

    } catch(err) {
      console.error('Erorr creating a user', err);
    }
  }

  /**
   * getMe - creates a new user record in the users collection
   * @reqeust: request sent by router
   * @response: JSON object with the feedback
   * returns: the JSON object along with 200 created
  */
  static async getMe(req, res) {
    const userCollection = dbClient.db.collection('users');
    let name_token = "";

    if ('x-token' in req.headers) {
       name_token = 'x-token';
    }
    else {
       name_token = 'X-Token';
    }
    const token = req.headers[name_token];
    let id = await redisClient.get(`auth_${token}`);
    if (!id) {
      return res.status(401).send({"error":"Unauthorized"});
    }
    else {
      const user = await userCollection.findOne({ "_id": new ObjectId(id)});
      return res.status(200).send({"id":user._id,"email":user.email});
    }
  }

}

export default UsersController;
