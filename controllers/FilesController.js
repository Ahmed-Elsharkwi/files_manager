import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import {v4 as uuidv4} from 'uuid'
import { promises as fs } from 'fs';
const fsSync = require('fs');

class FilesController {
  /**
   * getDisconnect - logout the user
   * @reqeust: request sent by router
   * @response: JSON object with the feedback
   * returns: the JSON object along with 200 OK
  */
  static async postUpload(req, res) {
    const fileCollection = dbClient.db.collection('files');
    const name_token = "x-token";
    const name = req.body.name;
    const type = req.body.type;
    const parentID = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    let data = ""

    if (type == 'file' || type == 'image') {
	data = req.body.data;
    }
    
    const token = req.headers[name_token];
    const user_id = await redisClient.get(`auth_${token}`)
    if (!user_id) {
      return res.status(401).send({"error":"Unauthorized"});
    }

    if (!name) {
      return res.status(400).send({"error":"Missing name"});
    }
    if (!type || (type != 'folder' && type != 'file' && type != 'image')) {
      return res.status(400).send({"error":"Missing type"});
    }
    if (type !== 'folder' && !data) {
      return res.status(400).send({"error":"Missing data"});
    }

    const file = await fileCollection.findOne({ "_id": new ObjectId(parentID)});
    if (!file && parentID != 0) {
       return res.status(400).send({"error":"Parent not found"});
    }
    if (parentID != 0 && file.type != "folder") {
       return res.status(400).send({"error":"Parent is not a folder"});
    }
    if (type == 'folder') {
      const newfolder = await fileCollection.insertOne({
        userId: new ObjectId(user_id),
        name: name,
	type: type,
	parentId: parentID,
	isPublic: isPublic,
      });

      const createdFolder = {
        id: newfolder.insertedId,
        userId: user_id,
        name: name,
        type: type,
	isPublic: isPublic,
        parentId: parentID
      }

      return res.status(201).json(createdFolder);
    }
    else {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager' 
      const fileName = `${filePath}/${uuidv4()}`;
      const buff = Buffer.from(data, 'base64');
      try {
        try {
          await fs.mkdir(filePath);
        } catch (error) {
        }
        await fs.writeFile(fileName, buff, 'utf-8');
      } catch (error) {
        console.log(error);
      }
      fileCollection.insertOne(
        {
          userId: new ObjectId(user_id),
          name,
          type,
          isPublic,
          parentId: parentID,
          localPath: fileName,
        },
      ).then((result) => {
        res.status(201).json(
          {
            id: result.insertedId,
            userId: user_id,
            name,
            type,
            isPublic,
            parentId: parentID,
          },
        )
      });
    }
  }


  static async getShow(req, res) {
    const Id = req.params.id;
    let name_token = "x-token";
    const fileCollection = dbClient.db.collection('files');
    const token = req.headers[name_token];
    const user_id = await redisClient.get(`auth_${token}`)
    if (!user_id) {
      return res.status(401).send({"error":"Unauthorized"});
    }

    if (!ObjectId.isValid(Id)) {
      return res.status(404).send({"error":"Not found"});
    }

    const file = await fileCollection.findOne({ "_id": new ObjectId(Id), userId: new ObjectId(user_id)});
    if (!file) {
      return res.status(404).send({"error":"Not found"});
    }
    return res.status(201).json(file);
  }

  static async getIndex(req, res) {
    const parent_Id = req.query.parentId;
    const name_token = "x-token";
    const token = req.headers[name_token];
    const user_id = await redisClient.get(`auth_${token}`);
    if (!user_id) {
      return res.status(401).send({"error":"Unauthorized"});
    }
    const fileCollection = dbClient.db.collection('files');

    }
    const file = await fileCollection.findOne({'parentId': parent_Id});
    if (!file && parent_Id != undefined) {
       return res.status(201).send([]);
    }
    const page = req.query.page || 0;
    const aggregationPipeline = [
    {
    $facet: {
	paginatedData: [
        { $skip: page * 20 }, // Skip based on page number
        { $limit: 20 } // Limit to items per page
	]
        },
        }
      ];

// Execute the aggregation pipeline
     const result =  await dbClient.db.collection('files').aggregate(aggregationPipeline).toArray();
     let new_data = [];
     if (parent_Id != undefined) {
      for (let item of result[0]['paginatedData']) {
	  if (item.parentId == parent_Id) {
		new_data.push(item);
	  }
      }
     }
     else {
      new_data = result[0]['paginatedData']
     }
// Extract paginatedData and totalCount from the result
    return res.status(201).json(new_data);
  }

  static async putPublish(req, res) {
    const name_token = 'x-token';
    const file_id = req.params.id;
    const token = req.headers[name_token];
    const user = await redisClient.get(`auth_${token}`);

    if (!user) {
      return res.status(401).json({'error':'Unauthorized'});
    }

    const fileCollection = await dbClient.db.collection('files');
    if (!ObjectId.isValid(file_id)) {
      return res.status(401).json({'error':'Not found'});	   
    }

    const file = await fileCollection.findOne({"userId": new ObjectId(user), '_id': new ObjectId(file_id)});

    if (!file) {
      return res.status(404).json({'error':'Not found'});
    }

    file.isPublic = true;

    await fileCollection.updateOne(
      {'_id': new ObjectId(file_id)},
      { $set: { 'isPublic': file.isPublic } }
    );
    return res.status(200).json(file);
  }

  static async putUnpublish(req, res) {
    const name_token = 'x-token';
    const file_id = req.params.id;
    const token = req.headers[name_token];
    const user = await redisClient.get(`auth_${token}`);

    if (!user) {
      return res.status(401).json({'error':'Unauthorized'});
    }

    const fileCollection = await dbClient.db.collection('files');
    if (!ObjectId.isValid(file_id)) {
      return res.status(401).json({'error':'Not found'});
    }

    const file = await fileCollection.findOne({"userId": new ObjectId(user), '_id': new ObjectId(file_id)});

    if (!file) {
      return res.status(404).json({'error':'Not found'});
    }

    file.isPublic = false;

    await fileCollection.updateOne(
      {'_id': new ObjectId(file_id)},
      { $set: { 'isPublic': file.isPublic } }
    );
    return res.status(200).json(file);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const name_token = 'x-token';
    const token = req.headers[name_token];
    const user =  await redisClient.get(`auth_${token}`);

    if (!user) {
      return res.status(401).json({'error':'Unauthorized'});
    }

    if (!ObjectId.isValid(fileId)) {
      return res.status(404).json({'error':'Not found1'});
    }

    const fileCollection = await dbClient.db.collection('files');
    const file = await fileCollection.findOne({'_id': new ObjectId(fileId)});

    if (!file) {
      return res.status(404).json({'error':'Not found2'});
    }

    if (user !== file.userId.toString() && file.isPublic === false) {
      return res.status(404).json({'error':'Not found3'});
    }

    if (file.type === 'folder') {
      return res.status(400).json({'error':"A folder doesn't have content"});
    }
    try {
      const fileData = fsSync.readFileSync(file.localPath, 'utf-8');
      return res.status(200).json(fileData.toString());
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({'error':'Not found4'});
      }
      throw err;
    }
  }
}

export default FilesController;
